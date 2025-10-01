declare module '#build/vuetify/configuration.mjs' {
  import type { VuetifyOptions } from 'vuetify'

  export type { VuetifyOptions }
  export function vuetifyConfiguration(): VuetifyOptions
}

declare module '#build/vuetify/ssr-client-hints-configuration.mjs' {
  export interface SSRClientHintsConfiguration {
    reloadOnFirstRequest: boolean
    viewportSize: boolean
    prefersColorScheme: boolean
    prefersReducedMotion: boolean
    clientWidth?: number
    clientHeight?: number
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
  export const ssrClientHintsConfiguration: SSRClientHintsConfiguration
}
