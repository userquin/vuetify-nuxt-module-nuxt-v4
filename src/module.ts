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
  /**
   * Use the following import in your Nuxt Client plugin to access rules configuration if you want to modify it:
   * ```ts
   * import { rulesOptions } from '#build/vuetify/labs-rules-configuration.mjs'
   * ```
   *
   * This will change when `vuetify/labs/rules` moved outside labs to:
   * `import { rulesOptions } from '#build/vuetify/rules-configuration.mjs'`
   */
  'vuetify:register-client-rules-plugin': (vuetify: ReturnType<typeof createVuetify>) => Promise<boolean> | boolean
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

    const ctx: VuetifyNuxtContext = {
      resolver: createResolver(import.meta.url),
      logger,
      moduleOptions: undefined!,
      vuetifyOptions: undefined!,
      vuetifyOptionsModules: [],
      imports: new Map(),
      configurationImports: '',
      enableRules: options.enableVuetifyRules === true,
      rulesConfiguration: {
        fromLabs: true,
        rulesImports: new Map(),
        imports: '',
        externalRules: [],
        rulesOptions: undefined!,
      },
      vuetifyFilesToWatch: [],
      isDev: nuxt.options.dev,
      i18n: hasNuxtModule('@nuxtjs/i18n', nuxt),
      isSSR: nuxt.options.ssr,
      isNuxtGenerate: !!nuxt.options.nitro.static,
      unocss: hasNuxtModule('@unocss/nuxt', nuxt),
      icons: undefined!,
      ssrClientHints: undefined!,
      sources: [],
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

    // load configuration
    await load(options, nuxt, ctx)

    // configure HTTP Client Hints
    prepareSSRClientHints(nuxt, ctx)

    // prepare Nuxt configuration templates
    // - HTTP Client Hints configuration
    // - Vuetify configuration
    addVuetifyNuxtTemplates(nuxt, ctx)

    // prepare Nuxt runtime
    // - inline styles
    // - add types
    // - add runtime plugins
    // - add Vuetify client and server plugins
    await prepareNuxtRuntime(nuxt, ctx)

    // register watcher to avoid Nuxt restarts
    registerWatcher(options, nuxt, ctx)
    /*
    nuxt.hook('modules:done', async () => {
    })
*/
  },
})
