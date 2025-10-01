import { rulesOptions } from '#build/vuetify/labs-rules-configuration.mjs'
import { defineNuxtPlugin, useNuxtApp } from '#imports'
import { createRulesPlugin } from 'vuetify/labs/rules'

export default defineNuxtPlugin({
  name: 'vuetify:labs-rules:plugin',
  dependsOn: ['vuetify:nuxt:client:plugin'],
  setup(nuxtApp) {
    const vuetify = useNuxtApp().$vuetify
    nuxtApp.vueApp.use(createRulesPlugin(rulesOptions, vuetify.locale))
  },
})
