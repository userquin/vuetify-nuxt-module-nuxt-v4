import { aliases, defaultSet, unocss } from '#build/vuetify/iconsets/unocss.mjs'
// import LuxonAdapter from '@date-io/luxon'
import { defineVuetifyConfiguration } from 'vuetify-nuxt-module/custom-configuration'
// import * as bp from 'vuetify/blueprints'
import { md3 } from 'vuetify/blueprints'
// import type { VuetifyOptions } from 'vuetify/framework'
import { theme } from './vuetify'
/* const theme: VuetifyOptions['theme'] = {
  defaultTheme: 'dark',
  themes: {
    light: {
      dark: false,
    },
    dark: {
      dark: true,
    },
  },
} */

export default defineVuetifyConfiguration({
  config: true,
  // date: {
  //   adapter: LuxonAdapter,
  // },
  icons: {
    defaultSet,
    sets: { unocss },
    aliases,
  },
  blueprint: /* bp. */md3,
  theme,
  /* theme: {
    defaultTheme: 'dark',
    themes: {
      light: {
        dark: false,
      },
      dark: {
        dark: true,
      },
    },
  }, */
})
