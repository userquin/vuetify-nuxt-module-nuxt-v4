import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import type { ProxifiedModule, ProxifiedObject } from 'magicast'
import type { VuetifyOptions } from 'vuetify'
import type { ResolvedIcons } from './icons/types'
import type { ResolvedClientHints } from './ssr-client-hints'
import type { MOptions, VuetifyModuleOptions } from './types'
import { normalize } from 'pathe'
// import { prepareConfiguration } from './prepare-configuration'
// import { prepareRulesConfiguration } from './prepare-rules-configuration'
// import { generateCode } from 'magicast'
import { loadConfiguration } from './load-configuration'

export const CONFIG_KEY = 'vuetify'

export interface Import {
  from: string
  local: string
  imported: string
}

export interface VuetifyOptionsInfo<T extends VuetifyOptions> {
  path?: string
  mode: 'default' | 'inline' | 'external'
  vuetifyOptions: ProxifiedObject<T>
  module: ProxifiedModule
  importsMap: Map<string, Import>
}

export interface VuetifyRules {
  aliases?: { [name: string]: unknown }
}

export interface VuetifyRulesInfo {
  mode: 'default' | 'external'
  path?: string
  rulesOptions: ProxifiedObject<VuetifyRules>
  module: ProxifiedModule
  importsMap: Map<string, Import>
}

export interface VuetifyNuxtContext {
  resolver: Resolver
  logger: ReturnType<typeof import('@nuxt/kit')['useLogger']>
  moduleOptions: MOptions
  vuetifyOptions: VuetifyOptionsInfo<VuetifyOptions>
  vuetifyOptionsModules: VuetifyOptionsInfo<VuetifyOptions>[]
  imports: Map<string, Import>
  configurationImports: string
  enableRules: boolean
  rulesConfiguration: {
    fromLabs: boolean
    rulesImports: Map<string, Import>
    imports: string
    externalRules: VuetifyRulesInfo[]
    rulesOptions: ProxifiedObject<VuetifyRules>
  }
  vuetifyFilesToWatch: string[]
  isDev: boolean
  i18n: boolean
  isSSR: boolean
  isNuxtGenerate: boolean
  sources: [rootDir: string, isFile: boolean, sources: string[]][]
  unocss: boolean
  icons: ResolvedIcons
  ssrClientHints: ResolvedClientHints
}

export async function load(
  options: VuetifyModuleOptions,
  nuxt: Nuxt,
  ctx: VuetifyNuxtContext,
) {
  ctx.imports.clear()
  ctx.vuetifyOptionsModules = []
  ctx.vuetifyFilesToWatch = []
  ctx.configurationImports = ''
  ctx.rulesConfiguration.rulesImports.clear()
  ctx.rulesConfiguration.imports = ''

  const vuetifyConfigurationFilesToWatch = new Set<string>()
  await loadConfiguration(
    nuxt,
    ctx,
    vuetifyConfigurationFilesToWatch,
    options,
  )
  /* await prepareConfiguration(
    nuxt,
    ctx,
    vuetifyConfigurationFilesToWatch,
    options,
  )

  await prepareRulesConfiguration(
    nuxt,
    ctx,
    vuetifyConfigurationFilesToWatch,
  )
  const imports = new Set<string>()
  console.log('CTX.IMPORTS')
  console.log(ctx.imports)
  if (ctx.imports.size > 0) {
    for (const mod of ctx.vuetifyOptionsModules) {
      if (mod.module.imports.$items.length) {
        for (const item of [...mod.module.imports.$items]) {
          if (!ctx.imports.has(item.$ast.local.name)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete mod.module.imports[item.$ast.local.name]
          }
        }
        if (mod.module.imports.$items.length) {
          for (const item of mod.module.imports.$items) {
            let imp = generateCode(item.$declaration).code
            // add local import to watched files
            if (item.from[0] === '.') {
              const path = resolve(nuxt.options.rootDir, item.from)
              vuetifyConfigurationFilesToWatch.add(path)
              if (item.from.length > 1 && item.from[1] === '.') {
                imp = imp.replace(/from\s+(['"])\.\./, 'from $1../../..')
              }
              else {
                imp = imp.replace(/from\s+(['"])\./, 'from $1../..')
              }
            }
            imports.add(imp)
          }
        }
      }
    }
    console.log(imports)
    ctx.configurationImports = imports.size > 0
      ? `${Array.from(imports).join('\n')}\n`
      : ''
  }
  else {
    ctx.configurationImports = ''
  } */

  /* const imports = new Set<Import>() */
  /* const imports = new Set<string>()
  for (const mod of ctx.vuetifyOptionsModules) {
    if (!mod.path || mod.mode !== 'external' || !mod.module.imports) {
      continue
    }
    for (const { from, local, imported } of Object.values(mod.module.imports).map(({ from, local, imported }) => ({ from, local, imported }))) {
      let useFrom = from
      if (from[0] === '.') {
        useFrom = relative(resolve(nuxt.options.buildDir, 'vuetify'), resolve(dirname(mod.path), from)).replace(/\\/g, '/')
        vuetifyConfigurationFilesToWatch.add(useFrom)
      }
      const staticImport = local === imported
        ? `import { ${imported} } from '${useFrom}'`
        : `import { ${imported} as ${local} } from '${useFrom}'`
      imports.add(staticImport)
    }
  }
  ctx.configurationImports = imports.size > 0
    ? `${Array.from(imports).join('\n')}\n`
    : '' */

  /* if (ctx.enableRules) {
    imports.clear()
    for (const mod of ctx.rulesConfiguration.externalRules) {
      if (!mod.path || mod.mode !== 'external' || !mod.module.imports) {
        continue
      }
      for (const { from, local, imported } of Object.values(mod.module.imports).map(({ from, local, imported }) => ({ from, local, imported }))) {
        let useFrom = from
        if (from[0] === '.') {
          useFrom = relative(resolve(nuxt.options.buildDir, 'vuetify'), resolve(dirname(mod.path), from)).replace(/\\/g, '/')
          vuetifyConfigurationFilesToWatch.add(useFrom)
        }
        const staticImport = local === imported
          ? `import { ${imported} } from '${useFrom}'`
          : `import { ${imported} as ${local} } from '${useFrom}'`
        imports.add(staticImport)
      }
    }
    ctx.rulesConfiguration.imports = imports.size > 0
      ? `${Array.from(imports).join('\n')}\n`
      : ''
  } */

  // prepare custom configuration imports
  /* if (ctx.imports.size) {
    for (const mod of ctx.vuetifyOptionsModules) {
      if (mod.imports.$items.length) {
        for (const item of [...mod.imports.$items]) {
          if (!ctx.imports.has(item.$ast.local.name)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete mod.imports[item.$ast.local.name]
          }
        }
        if (mod.imports.$items.length) {
          for (const item of mod.imports.$items) {
            let imp = generateCode(item.$declaration).code
            // add local import to watched files
            if (item.from[0] === '.') {
              const path = resolve(nuxt.options.rootDir, item.from)
              vuetifyConfigurationFilesToWatch.add(path)
              if (item.from.length > 1 && item.from[1] === '.') {
                imp = imp.replace(/from\s+(['"])\.\./, 'from $1../../..')
              }
              else {
                imp = imp.replace(/from\s+(['"])\./, 'from $1../..')
              }
            }
            imports.add(imp)
          }
        }
      }
    }
    ctx.configurationImports = imports.size > 0
      ? `${Array.from(imports).join('\n')}\n`
      : ''
  }
  else {
    ctx.configurationImports = ''
  }

  // prepare custom rules configuration imports
  if (ctx.enableRules) {
    imports.clear()
    console.log(ctx.rulesConfiguration.externalRules.length)
    for (const mod of ctx.rulesConfiguration.externalRules) {
      if (mod.imports.$items.length) {
        for (const item of [...mod.imports.$items]) {
          if (!ctx.rulesConfiguration.rulesImports.has(item.$ast.local.name)) {
            // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
            delete mod.imports[item.$ast.local.name]
          }
        }
        if (mod.imports.$items.length) {
          for (const item of mod.imports.$items) {
            let imp = generateCode(item.$declaration).code
            // add local import to watched files
            if (item.from[0] === '.') {
              const path = resolve(nuxt.options.rootDir, item.from)
              vuetifyConfigurationFilesToWatch.add(path)
              if (item.from.length > 1 && item.from[1] === '.') {
                imp = imp.replace(/from\s+(['"])\.\./, 'from $1../../..')
              }
              else {
                imp = imp.replace(/from\s+(['"])\./, 'from $1../..')
              }
            }
            imports.add(imp)
          }
        }
      }
    }
    ctx.rulesConfiguration.imports = imports.size > 0
      ? `${Array.from(imports).join('\n')}\n`
      : ''
  } */

  // prepare watcher
  ctx.vuetifyFilesToWatch = []
  for (const f of vuetifyConfigurationFilesToWatch) {
    const path = normalize(f)
    if (!/[\\/]node_modules[\\/]/.test(path))
      ctx.vuetifyFilesToWatch.push(path)
  }
}
