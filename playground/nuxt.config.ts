import { VuetifyComposables } from '@unvuetify/unimport-presets'

export default defineNuxtConfig({
  // extends: ['./layers/rules1'],
  modules: ['@nuxtjs/i18n', '../src/module'],
  ssr: true,
  imports: {
    imports: [VuetifyComposables({})],
    addons: {
      vueDirectives: true,
    },
  },
  devtools: { enabled: true },
  routeRules: {
    '/no-ssr': { ssr: false },
  },
  features: {
    devLogs: true,
  },
  nitro: {
    esbuild: {
      options: {
        target: 'esnext',
      },
    },
  },
  i18n: {
    // if not using RTL, you can replace locales with codes only
    // locales: ['en', 'es', 'ar'],
    locales: [{
      code: 'en-US',
      name: 'English (US)',
    }, {
      code: 'en-UK',
      name: 'English (UK)',
    }, {
      code: 'es-ES',
      name: 'Español (España)',
    }, {
      code: 'es-CO',
      name: 'Español (Colombia)',
    }, {
      code: 'ar-EG',
      name: 'العربية',
      dir: 'rtl',
    }],
    defaultLocale: 'en-US',
    strategy: 'prefix_except_default', // or 'prefix_except_default'
    vueI18n: './i18n.config.ts',
  },
  vuetify: {
    moduleOptions: {
      ssrClientHints: {
        reloadOnFirstRequest: false,
        prefersColorScheme: true,
        prefersColorSchemeOptions: {
          useBrowserThemeOnly: false,
        },
        viewportSize: true,
      },
      experimental: {
        tsdown: true,
      },
    },
    enableVuetifyRules: true,
  },
})
