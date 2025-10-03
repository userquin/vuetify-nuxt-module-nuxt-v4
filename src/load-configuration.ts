import type { Nuxt } from '@nuxt/schema'
import type { VuetifyNuxtContext } from './context'
import type { ExternalVuetifyOptions, MOptions, VuetifyModuleOptions } from './types'
import { parseModule, type ProxifiedModule, type ProxifiedObject } from 'magicast'
import type { VuetifyOptions } from 'vuetify/framework'
import { getDefaultExportOptions } from 'magicast/helpers'
import fsp from 'node:fs/promises'
import fs from 'node:fs'
import defu from 'defu'
import { dirname, normalize, relative as relativePath, resolve } from 'pathe'

export interface Import {
  from: string
  local: string
  imported: string
  relative: boolean
  filePathWithExtension?: string
  relativePath?: string
}

interface VuetifyRules {
  aliases?: { [name: string]: unknown }
}

interface ExternalVuetifyRules extends VuetifyRules {
  config: boolean
}

interface VuetifyOptionsConfiguration {
  configuration: ProxifiedObject<VuetifyOptions>
  importsMap: Map<string, Import>
  path?: string
}

interface VuetifyRulesConfiguration {
  configuration: ProxifiedObject<VuetifyRules>
  importsMap: Map<string, Import>
  path?: string
}

interface VuetifyConfiguration {
  vuetifyOptions: VuetifyOptionsConfiguration[]
  rulesOptions?: VuetifyRulesConfiguration
}

export async function loadConfiguration(
  nuxt: Nuxt,
  ctx: VuetifyNuxtContext,
  vuetifyConfigurationFilesToWatch: Set<string>,
  options: VuetifyModuleOptions,
): Promise<void> {
  // vuetify options
  const rootVuetifyOptionsModule = parseModule<VuetifyOptions>('export default {}')
  const rootVuetifyOptions = getDefaultExportOptions(rootVuetifyOptionsModule)
  let firstVuetifyOptionsImportsMap: Map<string, Import> | undefined
  // vuetify rules options
  const rootVuetifyRulesModule = parseModule<VuetifyRules>('export default { aliases: {} }')
  const rootVuetifyRules = getDefaultExportOptions(rootVuetifyRulesModule)
  let firstVuetifyRulesImportsMap: Map<string, Import> | undefined
  const inlineModules: MOptions[] = []
  let moduleOptions: MOptions = {}

  for await (
    const {
      vuetifyOptions,
      rulesOptions,
    } of readConfiguration(
      nuxt,
      ctx,
      options,
      inlineModules,
      vuetifyConfigurationFilesToWatch,
    )
  ) {
    // vuetify options
    if (vuetifyOptions.length > 0) {
      for (const { configuration, importsMap } of vuetifyOptions) {
        mergeConfiguration(
          (imp, impl) => ctx.imports.set(imp, impl),
          rootVuetifyOptions,
          firstVuetifyOptionsImportsMap ?? new Map(),
          configuration,
          importsMap,
        )
        firstVuetifyOptionsImportsMap = importsMap
      }
    }
    // vuetify rules options
    if (rulesOptions) {
      mergeConfiguration(
        (imp, impl) => ctx.rulesConfiguration.rulesImports.set(imp, impl),
        rootVuetifyRules,
        firstVuetifyRulesImportsMap ?? new Map(),
        rulesOptions.configuration,
        rulesOptions.importsMap,
      )
      firstVuetifyRulesImportsMap = rulesOptions.importsMap
    }
  }

  for (const mod of inlineModules.reverse()) {
    moduleOptions = defu(mod, moduleOptions)
  }

  ctx.moduleOptions = defu(options.moduleOptions, moduleOptions)
  ctx.vuetifyOptions = rootVuetifyOptions
  ctx.rulesConfiguration.rulesOptions = rootVuetifyRules

  const vuetifyBuildDir = resolve(nuxt.options.buildDir, 'vuetify')

  const [configurationImports, rulesConfigurationImports] = await Promise.all([
    collectImports(
      vuetifyBuildDir,
      nuxt,
      ctx,
      ctx.imports,
      vuetifyConfigurationFilesToWatch,
    ),
    collectImports(
      vuetifyBuildDir,
      nuxt,
      ctx,
      ctx.rulesConfiguration.rulesImports,
      vuetifyConfigurationFilesToWatch,
    ),
  ])

  ctx.configurationImports = configurationImports
  ctx.rulesConfiguration.imports = rulesConfigurationImports
}

async function* checkModules(
  path: string,
  extensions = ['mts', 'ts', 'mjs', 'js'],
): AsyncGenerator<string, undefined, void> {
  for (const ext of extensions) {
    const filePath = `${path}.${ext}`
    try {
      await fsp.access(filePath, fs.constants.R_OK)
      yield normalize(filePath)
    }
    catch {
      // just ignore
    }
  }
}

async function collectImports(
  vuetifyBuildDir: string,
  nuxt: Nuxt,
  ctx: VuetifyNuxtContext,
  globalImportMaps: Map<string, Import>,
  vuetifyConfigurationFilesToWatch: Set<string>,
) {
  const imports = new Map<string, string[]>()

  for (const globalImport of globalImportMaps.values()) {
    const { local, imported, from, relative } = globalImport
    let useFrom = from
    if (relative) {
      useFrom = relativePath(vuetifyBuildDir, from).replace(/\\/g, '/')
      globalImport.relativePath = useFrom
      for await (const file of checkModules(from)) {
        vuetifyConfigurationFilesToWatch.add(file)
        globalImport.filePathWithExtension = file
      }
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

function createImportMap(
  nuxt: Nuxt,
  path: string,
  module: ProxifiedModule,
) {
  const importsMap = new Map<string, Import>()
  for (const { from, imported, local } of Object.values(module.imports)) {
    let useFrom = from
    let relative = false
    if (from[0] === '.') {
      relative = true
      useFrom = resolve(dirname(path), from).replace(/\\/g, '/')
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

async function readVuetifyOptions(
  nuxt: Nuxt,
  path: string,
  fromNuxtConfig: boolean,
): Promise<VuetifyOptionsConfiguration | undefined> {
  const content = await readConfigurationFile(
    path,
  )
  if (!content) {
    return undefined
  }

  if (fromNuxtConfig) {
    const module = parseModule(content![1], {
      sourceFileName: content![0],
    })

    const config = getDefaultExportOptions(
      module,
    ) as ProxifiedObject<{
      vuetify?: { vuetifyOptions?: VuetifyOptions }
    }>
    const vuetifyOptions = config.vuetify?.vuetifyOptions
    if (!vuetifyOptions) {
      return undefined
    }
    const moduleImportMaps = createImportMap(
      nuxt,
      content![0],
      module,
    )
    extractImports(
      () => {},
      vuetifyOptions,
      moduleImportMaps,
    )

    return {
      path: content[0],
      configuration: vuetifyOptions,
      importsMap: moduleImportMaps,
    }
  }

  const module = parseModule<ExternalVuetifyOptions>(content![1], {
    sourceFileName: content![0],
  })

  const vuetifyOptions = getDefaultExportOptions(module)

  const include = vuetifyOptions.config === true

  const moduleImportMaps = include
    ? createImportMap(
        nuxt,
        content![0],
        module,
      )
    : new Map<string, Import>()

  // console.log(Object.values(module.imports).map(i => [i.from, i.imported, i.local] as const))
  // console.log(module.imports.$items.map(i => [i.$ast.local.name, i.$declaration.specifiers, i.$declaration] as const))

  if (vuetifyOptions.config === true) {
    delete vuetifyOptions.config
    return {
      path: content[0],
      configuration: vuetifyOptions,
      importsMap: moduleImportMaps,
    }
  }

  return undefined
}

async function readVuetifyRules(
  nuxt: Nuxt,
  path: string,
): Promise<VuetifyRulesConfiguration | undefined> {
  const content = await readConfigurationFile(
    path,
  )
  if (!content) {
    return undefined
  }
  const module = parseModule<ExternalVuetifyRules>(content![1], {
    sourceFileName: content![0],
  })

  const rulesOptions = getDefaultExportOptions(module)

  const include = rulesOptions.config === true

  const moduleImportMaps = include
    ? createImportMap(
        nuxt,
        content![0],
        module,
      )
    : new Map<string, Import>()

  // console.log(Object.values(module.imports).map(i => [i.from, i.imported, i.local] as const))
  // console.log(module.imports.$items.map(i => [i.$ast.local.name, i.$declaration.specifiers, i.$declaration] as const))

  if (rulesOptions.config === true) {
    delete rulesOptions.config
    return {
      path: content[0],
      configuration: rulesOptions,
      importsMap: moduleImportMaps,
    }
  }

  return undefined
}

function getVuetifyConfigurationPath(vuetifyOptions: VuetifyModuleOptions['vuetifyOptions']): string | undefined {
  return typeof vuetifyOptions === 'string'
    ? vuetifyOptions
    : typeof vuetifyOptions === 'object' && Object.keys(vuetifyOptions).length === 0
      ? 'vuetify.config'
      : undefined
}

async function* readConfiguration(
  nuxt: Nuxt,
  ctx: VuetifyNuxtContext,
  options: VuetifyModuleOptions,
  inlineModules: MOptions[],
  vuetifyConfigurationFilesToWatch: Set<string>,
): AsyncGenerator<VuetifyConfiguration, undefined, void> {
  let configuration: VuetifyConfiguration
  const layers = nuxt.options._layers.length
  const enableRules = ctx.enableRules
  for (let i = layers - 1; i > 0; i--) {
    const layer = nuxt.options._layers[i]!
    configuration = { vuetifyOptions: [] }
    const mOptions = layer.config && 'vuetify' in layer.config ? layer.config.vuetify as VuetifyModuleOptions : undefined
    const layerMOptions = mOptions?.moduleOptions
    if (layerMOptions) {
      inlineModules.unshift(layerMOptions)
    }
    const vuetifyOptions = mOptions?.vuetifyOptions
    if (typeof vuetifyOptions === 'object') {
      const vuetifyOptionsConfiguration = await readVuetifyOptions(
        nuxt,
        resolve(layer.config.rootDir, 'nuxt.config'),
        true,
      )
      if (vuetifyOptionsConfiguration) {
        const path = vuetifyOptionsConfiguration.path
        if (path) {
          vuetifyConfigurationFilesToWatch.add(path)
        }
        configuration.vuetifyOptions.push(vuetifyOptionsConfiguration)
      }
    }

    const path = getVuetifyConfigurationPath(vuetifyOptions)

    if (path) {
      const vuetifyOptionsConfiguration = await readVuetifyOptions(
        nuxt,
        resolve(layer.config.rootDir, path),
        false,
      )
      if (vuetifyOptionsConfiguration) {
        const path = vuetifyOptionsConfiguration.path
        if (path) {
          vuetifyConfigurationFilesToWatch.add(path)
        }
        configuration.vuetifyOptions.unshift(vuetifyOptionsConfiguration)
      }
    }
    if (enableRules) {
      configuration.rulesOptions = await readVuetifyRules(
        nuxt,
        resolve(layer.config.rootDir, 'vuetify.rules'),
      )
      const path = configuration.rulesOptions?.path
      if (path) {
        vuetifyConfigurationFilesToWatch.add(path)
      }
    }
    yield configuration
  }

  configuration = { vuetifyOptions: [] }
  const { vuetifyOptions } = options
  if (typeof vuetifyOptions === 'object') {
    const vuetifyOptionsConfiguration = await readVuetifyOptions(
      nuxt,
      resolve(nuxt.options.rootDir, 'nuxt.config'),
      true,
    )
    if (vuetifyOptionsConfiguration) {
      const path = vuetifyOptionsConfiguration.path
      if (path) {
        vuetifyConfigurationFilesToWatch.add(path)
      }
      configuration.vuetifyOptions.push(vuetifyOptionsConfiguration)
    }
  }

  const path = getVuetifyConfigurationPath(vuetifyOptions)

  if (path) {
    const vuetifyOptionsConfiguration = await readVuetifyOptions(
      nuxt,
      resolve(nuxt.options.rootDir, path),
      false,
    )
    if (vuetifyOptionsConfiguration) {
      const path = vuetifyOptionsConfiguration.path
      if (path) {
        vuetifyConfigurationFilesToWatch.add(path)
      }
      configuration.vuetifyOptions.unshift(vuetifyOptionsConfiguration)
    }
  }

  if (enableRules) {
    configuration.rulesOptions = await readVuetifyRules(
      nuxt,
      resolve(nuxt.options.rootDir, 'vuetify.rules'),
    )
    const path = configuration.rulesOptions?.path
    if (path) {
      ctx.vuetifyFilesToWatch.push(path)
    }
  }

  yield configuration
}
