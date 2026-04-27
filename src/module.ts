import type { HookResult } from '@nuxt/schema'
import type { createVuetify, VuetifyOptions } from 'vuetify'
import type { VuetifyNuxtContext } from './context'
import type {
  SSRClientHints,
  SSRClientHintsConfiguration,
  VuetifyModuleOptions,
} from './types'
import {
  createResolver,
  defineNuxtModule,
  getNuxtVersion,
  hasNuxtModule,
  isNuxtMajorVersion,
  useLogger,
} from '@nuxt/kit'
import { configureVuetify } from '@unvuetify/nuxt-utils'
import { version } from '../package.json'
import { CONFIG_KEY, load } from './context'
import { prepareNuxtRuntime } from './nuxt-runtime'
import { addVuetifyNuxtTemplates } from './nuxt-templates'
import { prepareSSRClientHints } from './ssr-client-hints'
import { registerWatcher } from './watcher'
import { isPackageExists } from 'local-pkg'
import { resolve } from 'pathe'

export type * from './types'

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ModuleOptions extends VuetifyModuleOptions {}

export interface ModuleRuntimeHooks {
  'vuetify:configuration': (options: {
    vuetifyOptions: VuetifyOptions
  }) => HookResult
  'vuetify:before-create': (options: {
    vuetifyOptions: VuetifyOptions
  }) => HookResult
  'vuetify:ready': (vuetify: ReturnType<typeof createVuetify>) => HookResult
  'vuetify:ssr-client-hints': (options: {
    vuetifyOptions: VuetifyOptions
    ssrClientHints: SSRClientHints
    ssrClientHintsConfiguration: SSRClientHintsConfiguration
  }) => HookResult
}

const logger = useLogger(`nuxt:${CONFIG_KEY}`)

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'vuetify-nuxt-module',
    configKey: 'vuetify',
    compatibility: {
      nuxt: '>=4.0.0',
    },
    version,
  },
  // Default configuration options of the Nuxt module
  defaults: () => ({
    vuetifyOptions: {},
    moduleOptions: {},
    enableVuetifyRules: false,
  }),
  async setup(options, nuxt) {
    if (isNuxtMajorVersion(2, nuxt))
      logger.error(`This module doesn't support nuxt version: ${getNuxtVersion(nuxt)}`)

    const fs = await import('node:fs')
    const path = resolve(nuxt.options.buildDir, 'tsconfig.json')
    async function checkTSConfigJson() {
      try {
        await fs.promises.access(path, fs.constants.R_OK)
        return true
      }
      catch {
        return false
      }
    }

    function hook(name: string) {
      // eslint-disable-next-line
      nuxt.hook(name as any, async () => console.log(`${name} => ${await checkTSConfigJson()}`))
    }
    hook('ready')
    hook('modules:before')
    hook('modules:done')
    hook('app:resolve')
    hook('app:templates')
    hook('app:templatesGenerated')
    hook('build:before')
    hook('build:done')
    hook('build:manifest')
    hook('build:analyze:done')
    hook('builder:generateApp')
    hook('builder:watch')
    hook('pages:extend')
    hook('pages:resolved')
    hook('pages:routerOptions')
    hook('server:devHandler')
    hook('imports:sources')
    hook('imports:extend')
    hook('imports:context')
    hook('imports:dirs')
    hook('components:dirs')
    hook('components:extend')
    hook('nitro:prepare:types')
    hook('nitro:config')
    hook('nitro:init')
    hook('nitro:build:before')
    hook('nitro:build:public-assets')
    hook('prerender:routes')
    hook('build:error')
    hook('prepare:types')
    hook('listen')

    /* nuxt.hook('build:error', () => {
      console.log(collect.join('\n'))
    })

    if (nuxt.options.dev) {
      nuxt.hook('ready', () => {
        console.log(collect.join('\n'))
      })
    }
    else {
      nuxt.hook('build:done', () => {
        console.log(collect.join('\n'))
      })
    } */

    const tsdownEnabled = options.moduleOptions?.experimental?.tsdown === true && isPackageExists('tsdown')
    const unocssInstalled = hasNuxtModule('@unocss/nuxt')

    const ctx: VuetifyNuxtContext = {
      resolver: createResolver(import.meta.url),
      logger,
      moduleOptions: undefined!,
      vuetifyOptions: undefined!,
      imports: new Map(),
      configurationImports: '',
      enableRules: options.enableVuetifyRules === true,
      rulesConfiguration: {
        fromLabs: true,
        rulesImports: new Map(),
        imports: '',
        rulesOptions: undefined!,
      },
      vuetifyFilesToWatch: [],
      isDev: nuxt.options.dev,
      i18n: hasNuxtModule('@nuxtjs/i18n', nuxt),
      isSSR: nuxt.options.ssr,
      isNuxtGenerate: !!nuxt.options.nitro.static,
      unocss: unocssInstalled,
      unocssInstalled,
      icons: undefined!,
      ssrClientHints: undefined!,
      sources: [],
      tsdownEnabled,
      tsdownPromise: Promise.resolve(),
      virtualModules: {
        options: {
          js: '',
          dts: '',
        },
        rules: {
          js: '',
          dts: '',
        },
        ssr: {
          js: '',
          dts: '',
        },
        unocss: {
          js: '',
          dts: '',
        },
      },
    }

    // configure Vuetify:
    // - unimport presets: directives and composables
    // - styles: vite sass/scss styles plugin
    // - assets: custom vue assets urls
    configureVuetify(nuxt, options.moduleOptions)

    // add i18n support
    if (ctx.i18n) {
      await import('@unvuetify/nuxt-i18n-utils')
        .then(m => m.configureI18n(nuxt))
        .catch(() => {
          ctx.i18n = false
          logger.warn('@nuxtjs/i18n module installed, but @unvuetify/nuxt-i18n-utils dependency not found, i18n support disabled!')
        })
    }

    console.log('process.cwd(): ', process.cwd())

    // load configuration
    await load(options, nuxt, ctx)

    // configure HTTP Client Hints
    prepareSSRClientHints(nuxt, ctx)

    // prepare Nuxt runtime
    // - inline styles
    // - add types
    // - add runtime plugins
    // - add Vuetify client and server plugins
    await prepareNuxtRuntime(nuxt, ctx)

    // register watcher to avoid Nuxt restarts
    registerWatcher(options, nuxt, ctx)

    nuxt.hook('modules:done', async () => {
      // prepare Nuxt configuration templates
      // - HTTP Client Hints configuration
      // - Vuetify configuration
      await addVuetifyNuxtTemplates(nuxt, ctx)
    })
  },
})
