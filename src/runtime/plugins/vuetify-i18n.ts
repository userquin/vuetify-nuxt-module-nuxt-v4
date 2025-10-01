import { defineNuxtPlugin } from '#imports'
import { configureVuetifyI18nAdapter, configureVuetifyI18nDateLocale } from '@unvuetify/nuxt-i18n-utils/runtime'

export default defineNuxtPlugin({
  name: 'vuetify:i18n:plugin',
  order: -25,
  // @ts-expect-error i18n plugin missing on build time
  dependsOn: ['i18n:plugin'],
  parallel: true,
  setup(nuxtApp) {
    nuxtApp.hook('vuetify:configuration', ({ vuetifyOptions }) => {
      configureVuetifyI18nAdapter(vuetifyOptions)
      vuetifyOptions.date = vuetifyOptions.date ?? {}
      configureVuetifyI18nDateLocale(vuetifyOptions.date)
    })
  },
})
