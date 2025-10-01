import type { Plugin } from '#app'
import type { UnwrapNestedRefs } from 'vue'
import type { SSRClientHints } from './types'
import { ssrClientHintsConfiguration } from '#build/vuetify/ssr-client-hints-configuration.mjs'
import { defineNuxtPlugin, useNuxtApp, useState } from '#imports'
import { reactive, ref, watch } from 'vue'
import { VuetifyHTTPClientHints } from './client-hints'

const plugin: Plugin<{
  ssrClientHints: UnwrapNestedRefs<SSRClientHints>
}> = defineNuxtPlugin({
  name: 'vuetify:client-hints:client:plugin',
  order: -25,
  parallel: true,
  setup(nuxtApp) {
    const state = useSSRClientHints()

    const {
      firstRequest,
      prefersColorSchemeAvailable,
      prefersReducedMotionAvailable,
      viewportHeightAvailable,
      viewportWidthAvailable,
    } = state.value

    const {
      reloadOnFirstRequest,
      viewportSize,
      prefersReducedMotion,
      prefersColorScheme,
      prefersColorSchemeOptions,
    } = ssrClientHintsConfiguration

    // reload the page when it is the first request, explicitly configured, and any feature available
    if (firstRequest && reloadOnFirstRequest) {
      if (prefersColorScheme) {
        const themeCookie = state.value.colorSchemeCookie
        // write the cookie and refresh the page if configured
        if (prefersColorSchemeOptions && themeCookie) {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
          const cookieName = prefersColorSchemeOptions.cookieName
          const parseCookieName = `${cookieName}=`
          const cookieEntry = `${parseCookieName}${state.value.colorSchemeFromCookie ?? prefersColorSchemeOptions.defaultTheme};`
          const newThemeName = prefersDark ? prefersColorSchemeOptions.darkThemeName : prefersColorSchemeOptions.lightThemeName
          document.cookie = themeCookie.replace(cookieEntry, `${cookieName}=${newThemeName};`)
          window.location.reload()
        }
        else if (prefersColorSchemeAvailable) {
          window.location.reload()
        }
      }

      if (prefersReducedMotion && prefersReducedMotionAvailable)
        window.location.reload()

      if (viewportSize && viewportHeightAvailable)
        window.location.reload()

      if (viewportSize && viewportWidthAvailable)
        window.location.reload()
    }

    // restore SSR state
    nuxtApp.hook('vuetify:before-create', ({ vuetifyOptions }) => {
      // on client, we update the display to avoid hydration mismatch on page refresh
      // there will be some hydration mismatch since the headers sent by the user agent may not be accurate
      if (viewportSize) {
        const clientWidth = state.value.viewportWidth
        const clientHeight = state.value.viewportHeight
        vuetifyOptions.ssr = typeof clientWidth === 'number'
          ? {
              clientWidth,
              clientHeight,
            }
          : true
      }
      else {
        vuetifyOptions.ssr = true
      }

      // update the theme
      if (prefersColorScheme && prefersColorSchemeOptions) {
        if (vuetifyOptions.theme === false) {
          vuetifyOptions.theme = { defaultTheme: state.value.colorSchemeFromCookie ?? prefersColorSchemeOptions.defaultTheme }
        }
        else {
          vuetifyOptions.theme = vuetifyOptions.theme ?? {}
          vuetifyOptions.theme.defaultTheme = state.value.colorSchemeFromCookie ?? prefersColorSchemeOptions.defaultTheme
        }
      }
    })

    // update theme logic
    if (prefersColorScheme && prefersColorSchemeOptions) {
      const themeCookie = state.value.colorSchemeCookie
      if (themeCookie) {
        nuxtApp.hook('app:beforeMount', () => {
          const vuetify = useNuxtApp().$vuetify
          // update the theme
          const cookieName = prefersColorSchemeOptions.cookieName
          const parseCookieName = `${cookieName}=`
          const cookieEntry = `${parseCookieName}${state.value.colorSchemeFromCookie ?? prefersColorSchemeOptions.defaultTheme};`
          watch(vuetify.theme.global.name, (newThemeName) => {
            document.cookie = themeCookie.replace(cookieEntry, `${cookieName}=${newThemeName};`)
          })
          if (prefersColorSchemeOptions.useBrowserThemeOnly) {
            const { darkThemeName, lightThemeName } = prefersColorSchemeOptions
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
            prefersDark.addEventListener('change', (e) => {
              vuetify.theme.global.name.value = e.matches ? darkThemeName : lightThemeName
            })
          }
        })
      }
    }

    return {
      provide: reactive({
        ssrClientHints: state,
      }),
    }
  },
})

export default plugin

function defaultClientValues() {
  return <SSRClientHints>{
    firstRequest: false,
    prefersColorSchemeAvailable: false,
    prefersReducedMotionAvailable: false,
    viewportHeightAvailable: true,
    viewportWidthAvailable: true,
    viewportHeight: window.innerHeight,
    viewportWidth: window.innerWidth,
  }
}

function useSSRClientHints() {
  const state = useState<SSRClientHints>(VuetifyHTTPClientHints)
  if (state.value)
    return state

  const initial = ref(defaultClientValues())

  if (!ssrClientHintsConfiguration.prefersColorScheme || !ssrClientHintsConfiguration.prefersColorSchemeOptions)
    return initial

  const {
    baseUrl,
    cookieName,
    defaultTheme,
  } = ssrClientHintsConfiguration.prefersColorSchemeOptions
  const cookieNamePrefix = `${cookieName}=`
  initial.value.colorSchemeFromCookie = document.cookie?.split(';')?.find(c => c.trim().startsWith(cookieNamePrefix))?.split('=')[1] ?? defaultTheme
  const date = new Date()
  const expires = new Date(date.setDate(date.getDate() + 365))
  initial.value.colorSchemeCookie = `${cookieName}=${initial.value.colorSchemeFromCookie}; Path=${baseUrl}; Expires=${expires.toUTCString()}; SameSite=Lax`

  return initial
}
