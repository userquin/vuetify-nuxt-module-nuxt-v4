import type { VuetifyNuxtOptions } from '@unvuetify/nuxt-utils'
import type { VuetifyOptions } from 'vuetify'

/**
 * Request headers received from the client in SSR.
 */
export interface SSRClientHints {
  /**
   * Is the first request the browser hits the server?
   */
  firstRequest: boolean
  /**
   * The browser supports prefer-color-scheme client hints?
   */
  prefersColorSchemeAvailable: boolean
  /**
   * The browser supports prefer-reduced-motion client hints?
   */
  prefersReducedMotionAvailable: boolean
  /**
   * The browser supports viewport-height client hints?
   */
  viewportHeightAvailable: boolean
  /**
   * The browser supports viewport-width client hints?
   */
  viewportWidthAvailable: boolean
  prefersColorScheme?: 'dark' | 'light' | 'no-preference'
  prefersReducedMotion?: 'no-preference' | 'reduce'
  viewportHeight?: number
  viewportWidth?: number
  /**
   * The theme name from the cookie.
   */
  colorSchemeFromCookie?: string
  colorSchemeCookie?: string
}

export interface SSRClientHintsConfiguration {
  enabled: boolean
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
  }
}

export const IconFontName = ['mdi', 'fa', 'fa4', 'md'] as const

export type IconFontNameType = typeof IconFontName[number]

export interface UnoCSSMdiIconSet {
  collapse?: string
  complete?: string
  cancel?: string
  close?: string
  delete?: string
  clear?: string
  success?: string
  info?: string
  warning?: string
  error?: string
  prev?: string
  next?: string
  checkboxOn?: string
  checkboxOff?: string
  checkboxIndeterminate?: string
  delimiter?: string
  sortAsc?: string
  sortDesc?: string
  expand?: string
  menu?: string
  subgroup?: string
  dropdown?: string
  radioOn?: string
  radioOff?: string
  edit?: string
  ratingEmpty?: string
  ratingFull?: string
  ratingHalf?: string
  loading?: string
  first?: string
  last?: string
  unfold?: string
  file?: string
  plus?: string
  minus?: string
  calendar?: string
  treeviewCollapse?: string
  treeviewExpand?: string
  eyeDropper?: string
  upload?: string
  color?: string
  // Font Awesome does not have most of these icons!
  command?: string
  ctrl?: string
  space?: string
  shift?: string
  alt?: string
  enter?: string
  arrowup?: string
  arrowdown?: string
  arrowleft?: string
  arrowright?: string
  backspace?: string
}

export interface UnoCSSIcons {
  /**
   * The prefix for UnoCSS Preset Icons.
   *
   * @default 'i-'
   */
  prefix?: string
  /**
   * The collection name for UnoCSS Preset Icons.
   *
   * @default 'mdi'
   */
  collection?: string
  /**
   * Override the default mdi icons.
   *
   * Icon names should include the prefix and the collection, for example:
   * - home: i-<collection>:<icon>
   */
  icons?: UnoCSSMdiIconSet
  /**
   * Additional icons to be added to the set.
   */
  additionalIcons?: Record<string, string>
}

export interface IconsOptions {
  /**
   * UnoCSS options.
   */
  unocss?: UnoCSSIcons
  /**
   * CSS Icon Fonts.
   *
   * By default, the module will add the corresponding CDN link to Nuxt `css` entry:
   * - mdi: https://cdn.jsdelivr.net/npm/@mdi/font@5.x/css/materialdesignicons.min.css
   * - md:  https://fonts.googleapis.com/css?family=Material+Icons
   * - fa:  https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@latest/css/all.min.css
   * - fa4: https://cdn.jsdelivr.net/npm/font-awesome@4.x/css/font-awesome.min.css
   *
   * You can specify a custom CDN link.
   */
  fontIcons?: [name: IconFontNameType, cdn?: string][]
  /**
   * Local Icon Fonts to use.
   */
  localFontIcons?: IconFontNameType[]
  /**
   * Enabling this option will check for local installed icon fonts and will add them to Nuxt `css` entry:
   * - mdi: will check for `@mdi/font`, if present will add `@mdi/font/css/materialdesignicons.css`
   * - md: will check for `material-design-icons-iconfont`, if present will add  `@mdi/font/css/materialdesignicons.css`
   * - fa: will check for `@fortawesome/fontawesome-free`, if present will add  `@fortawesome/fontawesome-free/css/all.css`
   * - fa4: will check for `font-awesome@4.7.0`, if present will add  `font-awesome/css/font-awesome.min.css`
   *
   * @default false
   */
  autoInstallLocalFontIcons?: boolean
}

export interface MOptions extends VuetifyNuxtOptions {
  /**
   * Vuetify SSR client hints.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Client_hints
   */
  ssrClientHints?: {
    /**
     * Should the module reload the page on first request?
     *
     * @default false
     */
    reloadOnFirstRequest?: boolean
    /**
     * Enable `Sec-CH-Viewport-Width` and `Sec-CH-Viewport-Height` headers?
     *
     * @see https://wicg.github.io/responsive-image-client-hints/#sec-ch-viewport-width
     * @see https://wicg.github.io/responsive-image-client-hints/#sec-ch-viewport-height
     *
     * @default false
     */
    viewportSize?: boolean
    /**
     * Enable `Sec-CH-Prefers-Color-Scheme` header?
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-CH-Prefers-Color-Scheme
     *
     * @default false
     */
    prefersColorScheme?: boolean
    /**
     * The options for `prefersColorScheme`, `prefersColorScheme` must be enabled.
     *
     * If you want the module to handle the color scheme for you, you should configure this option, otherwise you'll need to add your custom implementation.
     */
    prefersColorSchemeOptions?: {
      /**
       * The name for the cookie.
       *
       * @default 'color-scheme'
       */
      cookieName?: string
      /**
       * The default theme name.
       *
       * @default 'light'
       */
      defaultTheme?: string
      /**
       * The name for the dark theme.
       *
       * @default 'dark'
       */
      darkThemeName?: string
      /**
       * The name for the light theme.
       *
       * @default 'light'
       */
      lightThemeName?: string
      /**
       * Use the browser theme only?
       *
       * This flag can be used when your application provides a custom dark and light themes,
       * but will not provide a theme switcher, that's, using by default the browser theme.
       *
       * @default false
       */
      useBrowserThemeOnly?: boolean
    }
    /**
     * Enable `Sec-CH-Prefers-Reduced-Motion` header?
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Sec-CH-Prefers-Reduced-Motion
     *
     * @default false
     */
    prefersReducedMotion?: boolean
  }

  experimental?: {
    tsdown?: boolean
  }
}

/**
 * Nuxt extension for Vuetify options.
 *
 * If you are using [font icons](https://vuetifyjs.com/en/features/icon-fonts/):
 * - make sure to configure the `icons` option in the Vuetify configuration file
 * - use the `fontIcons`, `localFontIcons` or `autoInstallLocalFontIcons` options to add the corresponding css file to the Nuxt `css` entry
 * - don't import the css file in the configuration file, let the module handle it for you
 *
 * ```ts
 * // vuetify.config.ts
 * import { aliases, mdi } from 'vuetify/iconsets/mdi'
 * import { defineVuetifyConfiguration } from 'vuetify-nuxt-module/custom-configuration'
 *
 * export default defineVuetifyConfiguration({
 *   config: true,
 *   icons: {
 *     defaultSet: 'mdi',
 *     sets: { mdi },
 *     aliases
 *   },
 *   fontIcons: [['mdi']] // <== using the default CDN link for mdi
 * })
 * ```
 *
 * If you are using [SVG icons](https://vuetifyjs.com/en/features/icon-fonts/#svg-icons), add the logic in your Vuetify configuration file.
 *
 * If you are using UnoCSS icon set:
 * - you can import the `unocss` icon set from `#build/vuetify/iconsets/unocss.mjs`
 * - use it in the `icons` option in your Vuetify configuration file
 *
 * You can customize the icons using the `unocss` option in the Vuetify configuration file:
 * - `unocss.prefix`: The prefix for UnoCSS Preset Icons. Default is `i-`
 * - `unocss.collection`: The collection name for UnoCSS Preset Icons. Default is `mdi`
 * - `unocss.icons`: Override the default mdi icons.
 * - `unocss.additionalIcons`: Additional icons to be added to the set.
 *
 * ```ts
 * // vuetify.config.ts
 * import { aliases, defaultSet, unocss } from '#build/vuetify/iconsets/unocss.mjs'
 * import { defineVuetifyConfiguration } from 'vuetify-nuxt-module/custom-configuration'
 *
 * export default defineVuetifyConfiguration({
 *   config: true,
 *   icons: {
 *     defaultSet,
 *     sets: { unocss },
 *     aliases
 *   }
 * })
 * ```
 *
 * @see https://vuetifyjs.com/en/features/icon-fonts/
 * @see https://vuetifyjs.com/en/features/icon-fonts/#svg-icons
 */
export interface ExtendedNuxtVuetifyOptions extends VuetifyOptions, IconsOptions {
}

export interface VuetifyModuleOptions {
  moduleOptions?: MOptions
  /**
   * Vuetify options.
   *
   * You can inline the configuration or specify a file path:
   * `vuetifyOptions: './vuetify.options.ts'`
   *
   * The path should be relative to the root folder.
   */
  vuetifyOptions?: string | ExtendedNuxtVuetifyOptions

  /**
   * Vuetify Rules options.
   *
   * You can enable or disable the Vuetify rules adding the corresponding validation rules using external configuration file at your root folder:
   * - vuetify.rules.mts
   * - vuetify.rules.ts
   * - vuetify.rules.mjs
   * - vuetify.rules.js
   *
   * When enabled, the module will merge all the existing rules from all layers/modules installed and will install a Nuxt client plugin to register the Vuetify rules plugin.
   *
   * @default false
   */
  enableVuetifyRules?: boolean
}

export interface ExternalVuetifyOptions extends ExtendedNuxtVuetifyOptions {
  /**
   * Should this configuration file be merged with the existing configuration?
   *
   * When this flag is enabled, this configuration will be merged, otherwise will be ignored.
   *
   * @default false
   */
  config?: boolean
}
