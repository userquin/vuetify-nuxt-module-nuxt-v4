import type { Nuxt } from '@nuxt/schema'
import type { VuetifyOptions } from 'vuetify'
import type { VuetifyNuxtContext } from './context'

export interface ResolvedClientHints {
  enabled: boolean
  reloadOnFirstRequest: boolean
  viewportSize: boolean
  prefersColorScheme: boolean
  prefersReducedMotion: boolean
  prefersColorSchemeOptions?: {
    baseUrl: string
    defaultTheme: string
    themeNames: string[]
    cookieName: string
    darkThemeName: string
    lightThemeName: string
    useBrowserThemeOnly: boolean
  }
}

const disabledClientHints: ResolvedClientHints = Object.freeze({
  enabled: false,
  reloadOnFirstRequest: false,
  viewportSize: false,
  prefersColorScheme: false,
  prefersReducedMotion: false,
})

export function prepareSSRClientHints(
  nuxt: Nuxt,
  ctx: VuetifyNuxtContext,
) {
  if (!ctx.isSSR || ctx.isNuxtGenerate) {
    ctx.ssrClientHints = disabledClientHints
    return
  }

  const baseUrl = nuxt.options.app.baseURL ?? '/'

  const { ssrClientHints: ssrClientHintsConfiguration } = ctx.moduleOptions

  const clientHints: ResolvedClientHints = {
    enabled: false,
    reloadOnFirstRequest: ssrClientHintsConfiguration?.reloadOnFirstRequest ?? false,
    viewportSize: ssrClientHintsConfiguration?.viewportSize ?? false,
    prefersColorScheme: ssrClientHintsConfiguration?.prefersColorScheme ?? false,
    prefersReducedMotion: ssrClientHintsConfiguration?.prefersReducedMotion ?? false,
  }

  clientHints.enabled = clientHints.viewportSize || clientHints.prefersColorScheme || clientHints.prefersReducedMotion

  if (clientHints.enabled && clientHints.prefersColorScheme && ssrClientHintsConfiguration?.prefersColorSchemeOptions) {
    const theme = prepareTheme(ctx)
    if (!theme)
      throw new Error('Vuetify theme is disabled')

    const themes = theme.themes
    if (!themes)
      throw new Error('Vuetify themes is missing in theme!')

    const defaultTheme = theme.defaultTheme
    if (!defaultTheme)
      throw new Error('Vuetify default theme is missing in theme!')

    if (!themes[defaultTheme])
      throw new Error(`Missing default theme ${defaultTheme} in the Vuetify themes!`)

    const darkThemeName = ssrClientHintsConfiguration.prefersColorSchemeOptions?.darkThemeName ?? 'dark'
    if (!themes[darkThemeName])
      throw new Error(`Missing theme ${darkThemeName} in the Vuetify themes!`)

    const lightThemeName = ssrClientHintsConfiguration.prefersColorSchemeOptions?.lightThemeName ?? 'light'
    if (!themes[lightThemeName])
      throw new Error(`Missing theme ${lightThemeName} in the Vuetify themes!`)

    if (darkThemeName === lightThemeName)
      throw new Error('Vuetify dark theme and light theme are the same, change darkThemeName or lightThemeName!')

    clientHints.prefersColorSchemeOptions = {
      baseUrl,
      defaultTheme,
      themeNames: Array.from(Object.keys(themes)),
      cookieName: ssrClientHintsConfiguration.prefersColorSchemeOptions?.cookieName ?? 'color-scheme',
      darkThemeName,
      lightThemeName,
      useBrowserThemeOnly: ssrClientHintsConfiguration.prefersColorSchemeOptions?.useBrowserThemeOnly ?? false,
    }
  }

  ctx.ssrClientHints = clientHints
}

function prepareTheme(ctx: VuetifyNuxtContext): VuetifyOptions['theme'] {
  const theme = ctx.vuetifyOptions.vuetifyOptions.theme
  if (!theme) {
    throw new Error('Vuetify theme is disabled')
  }
  if (!theme.$ast || theme.$ast.type !== 'ObjectExpression') {
    const theme: VuetifyOptions['theme'] = {
      themes: {},
      defaultTheme: ctx.moduleOptions.ssrClientHints?.prefersColorSchemeOptions?.defaultTheme ?? 'light',
    }
    theme.themes![ctx.moduleOptions.ssrClientHints?.prefersColorSchemeOptions?.lightThemeName ?? 'light'] = {
      dark: false,
    }
    theme.themes![ctx.moduleOptions.ssrClientHints?.prefersColorSchemeOptions?.darkThemeName ?? 'dark'] = {
      dark: true,
    }
    return theme
  }

  return theme
}
