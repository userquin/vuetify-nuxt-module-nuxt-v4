import { parseExpression, type Proxified, type ProxifiedModule, type ProxifiedObject } from 'magicast'
import { generateCode, parseModule, loadFile } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'
import fsp from 'node:fs/promises'
import fs from 'node:fs'
import type { Nuxt } from '@nuxt/schema'
import { dirname, relative as relativePath, resolve } from 'pathe'
import { build } from 'tsdown'
import PluginAlias from '@rollup/plugin-alias'
import type { Program, VariableDeclarator } from '@babel/types'

interface Import {
  from: string
  local: string
  imported: string
  relative: boolean
}

async function readConfigurationFile(
  path: string,
  extensions = ['mts', 'ts', 'mjs', 'js'],
): Promise<[path: string, content: string, type: 'js' | 'ts'] | undefined> {
  for (const ext of extensions) {
    const filePath = `${path}.${ext}`
    try {
      await fsp.access(filePath, fs.constants.R_OK)
      return [
        filePath,
        await fsp.readFile(filePath, 'utf-8'),
        ext === 'js' || ext === 'mjs' ? 'js' : 'ts',
      ]
    }
    catch {
      // just ignore
    }
  }

  return undefined
}

// eslint-disable-next-line
function configFromNode(node: Proxified<any>): ProxifiedObject<any> {
  if (node.$type === 'function-call') {
    return node.$args[0]
  }
  return node
}

export function getConfigFromVariableDeclaration(
  // eslint-disable-next-line
  magicast: ProxifiedModule<any>,
): {
  declaration: VariableDeclarator
  // eslint-disable-next-line
  config: ProxifiedObject<any> | undefined
} {
  // if (magicast.exports.default.$type !== 'identifier') {
  //   throw new Error(
  //     `Not supported: Cannot modify this kind of default export (${magicast.exports.default.$type})`,
  //   )
  // }

  // const configDecalarationId = magicast.exports.default.$name

  for (const node of (magicast.$ast as Program).body) {
    console.log(node.type)
    if (node.type === 'VariableDeclaration') {
      for (const declaration of node.declarations) {
        if (
          declaration.id.type === 'Identifier'
          // && declaration.id.name === configDecalarationId
          && declaration.init
        ) {
          const init
            = declaration.init.type === 'TSSatisfiesExpression'
              ? declaration.init.expression
              : declaration.init

          const code = generateCode(init).code
          const configExpression = parseExpression(code)

          try {
            console.log({
              declaration,
              config: configFromNode(configExpression),
            })
          }
          catch {
            // just ignore
          }

          /* return {
            declaration,
            config: configFromNode(configExpression),
          } */
        }
      }
    }
  }
  // throw new Error('Couldn\'t find config declaration')
}

async function createImportMap(
  nuxt: Nuxt,
  path: string,
  module: ProxifiedModule,
) {
  console.log('Loading module info: ', path)
  try {
    console.log(getConfigFromVariableDeclaration(module))
  }
  catch (e) {
    console.error('WTF', e)
  }
  const importsMap = new Map<string, Import>()
  for (const { from, imported, local } of Object.values(module.imports)) {
    let useFrom = from
    let relative = false
    if (from[0] === '.') {
      relative = true
      useFrom = resolve(dirname(path), from).replace(/\\/g, '/')
      console.log('Loading relative import: ', useFrom)
      try {
        console.log(getConfigFromVariableDeclaration(await loadFile(`${useFrom}.ts`)))
      }
      catch (e) {
        console.error('WTF', e)
      }
    }
    importsMap.set(local, { from: useFrom, imported, local, relative })
  }
  return importsMap
}

function mergeConfiguration(
  addImport: (imp: string, impl: Import) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  first: ProxifiedObject<any>,
  firstImports: Map<string, Import>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  last: ProxifiedObject<any>,
  lastImports: Map<string, Import>,
) {
  const seen = new Set<string>()
  for (const [key, value] of Object.entries(last)) {
    seen.add(key)
    if (!value.$ast?.type) {
      first[key] = value
      continue
    }
    // import specifier => blueprint or date adapter for example
    if (value.$ast.type === 'Identifier') {
      // add the specifier to the imports
      addImport(value.$ast.name, lastImports.get(value.$ast.name)!)
      first[key] = value
      continue
    }
    if (value.$ast.type === 'MemberExpression') {
      if (value.$ast.object.type === 'Identifier' && value.$ast.property.type === 'Identifier') {
        addImport(value.$ast.object.name, lastImports.get(value.$ast.object.name)!)
        first[key] = value
        continue
      }
    }
    // we need to merge data only when both are objects
    if (value.$ast.type === 'ObjectExpression') {
      // if (key in first) {
      if (first[key]) {
        if (first[key].$ast.type === 'ObjectExpression') {
          // merge the child object
          mergeConfiguration(addImport, first[key], firstImports, value, lastImports)
        }
        else {
          if (value.$ast) {
            extractImports(addImport, value, lastImports)
          }
          first[key] = value
        }
      }
      else {
        extractImports(addImport, value, lastImports)
        first[key] = value
      }
      continue
    }
    // in any other case we just replace the value
    first[key] = value
  }

  // we need to traverse the first object to find any missing imports
  for (const key of Object.keys(first)) {
    if (seen.has(key))
      continue

    const value = first[key]
    if (!value.$ast?.type) {
      continue
    }

    if (value.$ast.type === 'Identifier') {
      addImport(value.$ast.name, firstImports.get(value.$ast.name)!)
      continue
    }
    if (value.$ast.type === 'MemberExpression') {
      if (value.$ast.object.type === 'Identifier' && value.$ast.property.type === 'Identifier') {
        addImport(value.$ast.object.name, firstImports.get(value.$ast.object.name)!)
        continue
      }
    }
    if (value.$ast.type === 'ObjectExpression') {
      extractImports(addImport, value, firstImports)
    }
  }
}

function extractImports(
  addImport: (imp: string, impl: Import) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: ProxifiedObject<any>,
  imports: Map<string, Import>,
) {
  for (const [_, value] of Object.entries(obj)) {
    if (!value.$ast?.type)
      continue

    if (value.$ast.type === 'Identifier') {
      addImport(value.$ast.name, imports.get(value.$ast.name)!)
      continue
    }
    if (value.$ast.type === 'MemberExpression') {
      if (value.$ast.object.type === 'Identifier' && value.$ast.property.type === 'Identifier') {
        addImport(value.$ast.object.name, imports.get(value.$ast.object.name)!)
        continue
      }
    }
    if (value.$ast.type === 'ObjectExpression') {
      extractImports(addImport, value, imports)
    }
  }
}

interface VuetifyRules {
  aliases?: { [name: string]: unknown }
}

interface ExternalVuetifyRules extends VuetifyRules {
  config: boolean
}

async function* test(
  nuxt: Nuxt,
  files: string[], /* , importMaps: Map<string, Import> */
) {
  for (const path of files) {
    const content = await readConfigurationFile(
      path,
    )
    const module = parseModule<ExternalVuetifyRules>(content![1], {
      sourceFileName: content![0],
    })

    const rulesOptions = getDefaultExportOptions(module)

    const include = rulesOptions.config === true

    const moduleImportMaps = include
      ? await createImportMap(
          nuxt,
          content![0],
          module,
        )
      : new Map<string, Import>()

    // console.log(Object.values(module.imports).map(i => [i.from, i.imported, i.local] as const))
    // console.log(module.imports.$items.map(i => [i.$ast.local.name, i.$declaration.specifiers, i.$declaration] as const))

    /* extractImports(
      () => {},
      rulesOptions,
      moduleImportMaps,
    ) */
    yield [path, module, moduleImportMaps, rulesOptions] as const
  }
}

function collectImports(
  nuxt: Nuxt,
  globalImportMaps: Map<string, Import>,
  vuetifyConfigurationFilesToWatch: Set<string>,
) {
  const imports = new Map<string, string[]>()

  for (const { local, imported, from, relative } of globalImportMaps.values()) {
    let useFrom = from
    if (relative) {
      useFrom = relativePath(resolve(nuxt.options.buildDir, 'vuetify'), from).replace(/\\/g, '/')
      vuetifyConfigurationFilesToWatch.add(from)
    }
    let list = imports.get(useFrom)
    if (!list) {
      list = []
      imports.set(useFrom, list)
    }
    list.push(local === imported ? imported : `${imported} as ${local}`)
  }

  return imports.entries().reduce((acc, [from, list]) => {
    acc.push(`import { ${list.join(', ')} } from '${from}'`)
    return acc
  }, [] as string[]).join('\n')
}

async function runTest() {
  const globalImportMaps = new Map<string, Import>()
  const rootModule = parseModule<ExternalVuetifyRules>('export default { aliases: {} }')
  const rootRulesOptions = getDefaultExportOptions(rootModule)
  let firstImports: Map<string, Import> | undefined
  const nuxt = {
    options: {
      buildDir: resolve('playground/.nuxt'),
    },
  } as Nuxt
  for await (
    const [
      path,
      _module,
      moduleImportMaps,
      rulesOptions,
    ] of test(
      nuxt,
      [
        './playground/layers/rules1/vuetify.rules',
        './playground/vuetify.rules',
      ],
    )
  ) {
    console.log(`Imports for ${path}:`, rulesOptions.config === true, moduleImportMaps)
    if (rulesOptions.config === true) {
      console.log(path)
      delete rulesOptions.config
      mergeConfiguration(
        (imp, impl) => globalImportMaps.set(imp, impl),
        rootRulesOptions,
        firstImports ?? new Map(),
        rulesOptions,
        moduleImportMaps,
      )
      firstImports = moduleImportMaps
    }
  }
  const vuetifyConfigurationFilesToWatch = new Set<string>()
  console.log('Global imports: ', globalImportMaps)
  console.log(`${collectImports(nuxt, globalImportMaps, vuetifyConfigurationFilesToWatch)}
${generateCode(rootModule).code}`)
  console.log(vuetifyConfigurationFilesToWatch)

  console.time('tsdown:build')
  await build({
    entry: [
      resolve('./playground/.nuxt/vuetify/temp-configuration.ts'),
      resolve('./playground/.nuxt/vuetify/temp-labs-rules-configuration.ts'),
    ],
    /* inputOptions: {
      input: resolve('./playground/.nuxt/vuetify/labs-rules-configuration.ts'),
      cwd: resolve('./playground/.nuxt'),
      tsconfig: resolve('./tsconfig.json'),
      platform: 'neutral',
      resolve: {
        alias: {
          '../../layers/rules1/vuetify-rules': resolve('./playground/layers/rules1/vuetify-rules.ts'),
          '../../vuetify-rules': resolve('./playground/vuetify-rules.ts'),
        },
      },
      plugins: [PluginAlias({
        entries: [
          { find: '../../layers/rules1/vuetify-rules', replacement: resolve('./playground/layers/rules1/vuetify-rules.ts') },
          { find: '../../vuetify-rules', replacement: resolve('./playground/vuetify-rules.ts') },
        ],
      })],
    }, */
    // https://github.com/rolldown/rolldown/issues/3615
    plugins: [PluginAlias({
      entries: [
        { find: '../../layers/rules1/vuetify-rules', replacement: resolve('./playground/layers/rules1/vuetify-rules.ts') },
        { find: '../../vuetify-rules', replacement: resolve('./playground/vuetify-rules.ts') },
        { find: '../../vuetify', replacement: resolve('./playground/vuetify.ts') },
      ],
    })],
    cwd: resolve('./playground/.nuxt'),
    /* outputOptions: {
      name: 'labs-rules-configuration.d.mts',
      dir: resolve('./playground/.nuxt/vuetify'),
    }, */
    tsconfig: resolve('./tsconfig.json'),
    dts: {
      // cwd: resolve('./playground/.nuxt'),
      // tsconfig: resolve('./tsconfig.json'),
      // emitDtsOnly: true,
      // emitJs: true,
      // dtsInput: true,
      // build: true,
      vue: true,
    },
    // unbundle: true,
    outDir: resolve('./playground/.nuxt/vuetify/'),
    format: 'es',
    clean: false,
    /* alias: {
      '../../layers/rules1/vuetify-rules': resolve('./playground/layers/rules1/vuetify-rules.ts'),
      '../../vuetify-rules': resolve('./playground/vuetify-rules.ts'),
    }, */
    /* noExternal: [
      '../../layers/rules1/vuetify-rules',
      '../../vuetify-rules',
      '../../vuetify',
    ], */
    external: [
      'defu',
      'local-pkg',
      'chokidar',
      'pathe',
      'perfect-debounce',
      'readdirp',
      'vuetify',
      /^vuetify\//,
      'vue',
      // '../../layers/rules1/vuetify-rules',
      // '../../vuetify-rules',
    ],
  })
  console.timeEnd('tsdown:build')
}

runTest()
