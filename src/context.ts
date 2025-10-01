import type { Resolver } from '@nuxt/kit'
import type { Nuxt } from '@nuxt/schema'
import type { ProxifiedModule, ProxifiedObject } from 'magicast'
import type { VuetifyOptions } from 'vuetify'
import type { ResolvedIcons } from './icons/types'
import type { ResolvedClientHints } from './ssr-client-hints'
import type { MOptions, VuetifyModuleOptions } from './types'
import { normalize, resolve } from 'node:path'
import { generateCode } from 'magicast'
import { prepareConfiguration } from './prepare-configuration'

export const CONFIG_KEY = 'vuetify'

export interface VuetifyOptionsInfo<T extends VuetifyOptions> {
  path?: string
  mode: 'default' | 'inline' | 'external'
  vuetifyOptions: ProxifiedObject<T>
  module: ProxifiedModule
}

export interface VuetifyNuxtContext {
  resolver: Resolver
  logger: ReturnType<typeof import('@nuxt/kit')['useLogger']>
  moduleOptions: MOptions
  vuetifyOptions: VuetifyOptionsInfo<VuetifyOptions>
  vuetifyOptionsModules: ProxifiedModule<VuetifyOptions>[]
  imports: Set<string>
  configurationImports: string
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

  const vuetifyConfigurationFilesToWatch = new Set<string>()
  await prepareConfiguration(
    nuxt,
    ctx,
    vuetifyConfigurationFilesToWatch,
    options,
  )

  if (ctx.imports.size) {
    const imports = new Set<string>()
    for (const mod of ctx.vuetifyOptionsModules) {
      if (mod.imports.$items.length) {
        for (const item of [...mod.imports.$items]) {
          if (!ctx.imports.has(item.$ast.local.name)) {
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

  ctx.vuetifyFilesToWatch = []
  for (const f of vuetifyConfigurationFilesToWatch) {
    const path = normalize(f)
    if (!/[\\/]node_modules[\\/]/.test(path))
      ctx.vuetifyFilesToWatch.push(path)
  }
}
