import { rulesOptions } from '#build/vuetify/rules-configuration.mjs'
import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { createRulesPlugin } from 'vuetify/labs/rules'

export default defineNuxtPlugin({
  name: 'vuetify:rules:plugin',
  dependsOn: ['vuetify:nuxt:client:plugin'],
  parallel: true,
  setup(nuxtApp) {
    const vuetify = useNuxtApp().$vuetify
    nuxtApp.vueApp.use(createRulesPlugin(rulesOptions, vuetify.locale))
  },
})
