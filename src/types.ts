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

export const IconSetName = ['mdi', 'fa', 'fa4', 'md', 'mdi-svg', 'fa-svg', 'unocss', 'custom'] as const
export const IconFontName = ['mdi', 'fa', 'fa4', 'md'] as const

export type IconSetNameType = typeof IconSetName[number]
export type IconFontNameType = typeof IconFontName[number]

export interface FontIconSet {
  name: IconFontNameType
  /**
   * Use CDN?
   *
   * - mdi: https://cdn.jsdelivr.net/npm/@mdi/font@5.x/css/materialdesignicons.min.css
   * - md:  https://fonts.googleapis.com/css?family=Material+Icons
   * - fa:  https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@latest/css/all.min.css
   * - fa4: https://cdn.jsdelivr.net/npm/font-awesome@4.x/css/font-awesome.min.css
   *
   * @default the corresponding CDN for the icon set
   */
  cdn?: string
}

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

export interface JSSVGIconSet {
  aliases?: Record<string, string>
}

export interface FontAwesomeSvgIconSet {
  /**
   * The libraries to import and register with the corresponding name.
   *
   * For example, to import free svg icons, `libraries` should be (the default):
   * `libraries: [[false, 'fas', '@fortawesome/free-solid-svg-icons']]
   *
   * Following with the example, the resulting import will be:
   * `import { fas } from '@fortawesome/free-solid-svg-icons'`
   *
   * @default [[false, 'fas', '@fortawesome/free-solid-svg-icons']]
   */
  libraries?: [defaultExport: boolean, name: string, library: string][]
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
   * @default 'mdi'
   */
  defaultSet: IconSetNameType
  /**
   * UnoCSS options.
   */
  unocss?: UnoCSSIcons
  /**
   * The icon sets to use.
   */
  sets?: IconFontNameType | IconFontNameType[] | FontIconSet[]
  /**
   * The SVG icon sets to use.
   */
  svg?: {
    mdi?: JSSVGIconSet
    fa?: FontAwesomeSvgIconSet
  }
}

export interface MOptions extends VuetifyNuxtOptions {
  /**
   * The icon sets to use.
   *
   * By default, the module will check for the following icon sets:
   * - `mdi` (Material Design Icons)
   * - `fa` (Font Awesome)
   * - `fa4` (Font Awesome 4)
   * - `md` (Material Design Font Icons)
   * - `mdi-svg` (Material Design SVG Icons)
   * - `fa-svg` (Font Awesome SVG)
   * - `unocss` (UnoCSS Icons, Material Design Icons by default)
   *
   * If you want to provide your own configuration, set this option to `false`.
   *
   * This module will export the icon sets using `#build/vuetify/iconsets/icons.js` virtual module,
   * including all the icon sets with a custom component: the module will omit the last step if
   * `defaultSet` is set to `custom`, or if the `icons` option is found in the Vuetify configuration
   * file.
   *
   * You can also provide your own configuration letting this module generate the icon sets for you,
   * then use `custom` in the `defaultSet` icons option, all the icon sets can be imported via
   * the corresponding virtual module; `#build/vuetify-icons/<icon-set-name>`.
   *
   * @default true
   */
  icons?: boolean | IconsOptions
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
  vuetifyOptions?: string | VuetifyOptions

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

export interface ExternalVuetifyOptions extends VuetifyOptions {
  /**
   * Should this configuration file be merged with the existing configuration?
   *
   * When this flag is enabled, this configuration will be merged, otherwise will be ignored.
   *
   * @default false
   */
  config?: boolean
}
