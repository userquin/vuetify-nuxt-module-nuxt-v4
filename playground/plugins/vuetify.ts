export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.hook('vuetify:before-create', ({ vuetifyOptions }) => {
    console.log('vuetify:before-create', vuetifyOptions.theme)
  })
  nuxtApp.hook('vuetify:ready', (vuetify) => {
    console.log('vuetify:ready', vuetify.theme)
  })
})
