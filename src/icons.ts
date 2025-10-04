import type { Nuxt } from '@nuxt/schema'
import type { IconFontNameType, UnoCSSMdiIconSet } from './types'
import type { VuetifyNuxtContext } from './context'
import { IconFontName } from './types'
import { isPackageExists } from 'local-pkg'
import { generateCode } from 'magicast'

export interface ResolvedIcons {
  unocss?: {
    prefix: string
    collection: string
    icons?: UnoCSSMdiIconSet
    additionalIcons?: Record<string, string>
  }
  fontIcons: Map<IconFontNameType, string>
  local: Map<IconFontNameType, string>
  autoInstallLocalFontIcons: boolean
}

export async function prepareIconsOptions(
  ctx: VuetifyNuxtContext,
) {
  ctx.icons = {
    fontIcons: new Map(),
    local: new Map(),
    autoInstallLocalFontIcons: ctx.vuetifyOptions.autoInstallLocalFontIcons === true,
  }

  for await (const [name, css, local] of checkLocalIconFonts(ctx)) {
    if (local) {
      ctx.icons.local.set(name, css)
    }
    else {
      ctx.icons.fontIcons.set(name, css)
    }
  }

  delete ctx.vuetifyOptions.fontIcons
  delete ctx.vuetifyOptions.localFontIcons
  delete ctx.vuetifyOptions.autoInstallLocalFontIcons

  ctx.unocss = ctx.unocssInstalled && (
    !!ctx.vuetifyOptions.unocss
    || Array.from(ctx.imports.values()).some(({ from }) => from === '#build/vuetify/iconsets/unocss.mjs')
  )

  if (ctx.unocss) {
    if (ctx.vuetifyOptions.unocss) {
      const icons = ctx.vuetifyOptions.unocss.icons
      const additionalIcons = ctx.vuetifyOptions.unocss.additionalIcons
      ctx.icons.unocss = {
        prefix: ctx.vuetifyOptions.unocss.prefix || 'i-',
        collection: ctx.vuetifyOptions.unocss.collection || 'mdi',
        icons: icons ? JSON.parse(generateCode(icons).code) : undefined,
        additionalIcons: additionalIcons ? JSON.parse(generateCode(additionalIcons).code) : undefined,
      }
    }
    else {
      ctx.icons.unocss = {
        prefix: 'i-',
        collection: 'mdi',
      }
    }
  }

  delete ctx.vuetifyOptions.unocss
}

const iconsPackageNames: Record<IconFontNameType, { name: string, css: string }> = {
  mdi: { name: '@mdi/font', css: '@mdi/font/css/materialdesignicons.css' },
  md: { name: 'material-design-icons-iconfont', css: '@mdi/font/css/materialdesignicons.css' },
  fa: { name: '@fortawesome/fontawesome-free', css: '@fortawesome/fontawesome-free/css/all.css' },
  fa4: { name: 'font-awesome@4.7.0', css: 'font-awesome/css/font-awesome.min.css' },
}

const IconsPackagesNames = new Set<string>(Object.values(iconsPackageNames).map(value => value.name))

const iconsCDN: Record<IconFontNameType, string> = {
  mdi: 'https://cdn.jsdelivr.net/npm/@mdi/font@5.x/css/materialdesignicons.min.css',
  md: 'https://fonts.googleapis.com/css?family=Material+Icons',
  fa: 'https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@latest/css/all.min.css',
  fa4: 'https://cdn.jsdelivr.net/npm/font-awesome@4.x/css/font-awesome.min.css',
}

async function* checkLocalIconFonts(
  ctx: VuetifyNuxtContext,
): AsyncGenerator<[
  name: IconFontNameType,
  css: string,
  local: boolean,
], undefined, void> {
  const css = new Set<IconFontNameType>(IconFontName)

  // first local defined fonts
  if (ctx.vuetifyOptions.localFontIcons) {
    for (const name of ctx.vuetifyOptions.localFontIcons) {
      if (name in iconsPackageNames) {
        const entry = iconsPackageNames[name as IconFontNameType].css
        css.delete(name)
        if (isPackageExists(entry)) {
          yield [name as IconFontNameType, entry, true]
        }
        else {
          ctx.logger.warn(`Missing local font at "localFontIcons" ${name}, ignoring the font css`)
        }
      }
    }
  }

  // next auto detect local fonts
  if (ctx.vuetifyOptions.autoInstallLocalFontIcons && css.size > 0) {
    for (const name of css) {
      const entry = iconsPackageNames[name].css
      if (isPackageExists(entry)) {
        css.delete(name)
        yield [name, entry, true]
      }
    }
  }

  // last ones the CDN links
  if (ctx.vuetifyOptions.fontIcons && css.size > 0) {
    for (const [name, cdn] of ctx.vuetifyOptions.fontIcons) {
      if (css.has(name)) {
        css.delete(name)
        yield [name, cdn || iconsCDN[name], false]
      }
    }
  }
}

export function resolveUnoCSSIcons(
  options: ResolvedIcons,
) {
  const {
    prefix,
    collection,
    icons,
    additionalIcons,
  } = options.unocss!

  const usePrefix = `${prefix.endsWith('-') ? prefix : `${prefix}-`}${collection}`

  const useIcons: import('vuetify/framework').IconAliases = {
    ...additionalIcons,
    collapse: `${usePrefix}:chevron-up`,
    complete: `${usePrefix}:check`,
    cancel: `${usePrefix}:close-circle`,
    close: `${usePrefix}:close`,
    // delete (e.g. v-chip close)
    delete: `${usePrefix}:close-circle`,
    clear: `${usePrefix}:close-circle`,
    success: `${usePrefix}:check-circle`,
    info: `${usePrefix}:information`,
    warning: `${usePrefix}:alert-circle`,
    error: `${usePrefix}:close-circle`,
    prev: `${usePrefix}:chevron-left`,
    next: `${usePrefix}:chevron-right`,
    checkboxOn: `${usePrefix}:checkbox-marked`,
    checkboxOff: `${usePrefix}:checkbox-blank-outline`,
    checkboxIndeterminate: `${usePrefix}:minus-box`,
    delimiter: `${usePrefix}:circle`,
    // for carousel
    sortAsc: `${usePrefix}:arrow-up`,
    sortDesc: `${usePrefix}:arrow-down`,
    expand: `${usePrefix}:chevron-down`,
    menu: `${usePrefix}:menu`,
    subgroup: `${usePrefix}:menu-down`,
    dropdown: `${usePrefix}:menu-down`,
    radioOn: `${usePrefix}:radiobox-marked`,
    radioOff: `${usePrefix}:radiobox-blank`,
    edit: `${usePrefix}:pencil`,
    ratingEmpty: `${usePrefix}:star-outline`,
    ratingFull: `${usePrefix}:star`,
    ratingHalf: `${usePrefix}:star-half-full`,
    loading: `${usePrefix}:cached`,
    first: `${usePrefix}:page-first`,
    last: `${usePrefix}:page-last`,
    unfold: `${usePrefix}:unfold-more-horizontal`,
    file: `${usePrefix}:paperclip`,
    plus: `${usePrefix}:plus`,
    minus: `${usePrefix}:minus`,
    calendar: `${usePrefix}:calendar`,
    treeviewCollapse: `${usePrefix}:menu-down`,
    treeviewExpand: `${usePrefix}:menu-right`,
    tableGroupCollapse: `${usePrefix}:chevron-down`,
    tableGroupExpand: `${usePrefix}:chevron-right`,
    eyeDropper: `${usePrefix}:eyedropper`,
    upload: `${usePrefix}:cloud-upload`,
    color: `${usePrefix}:palette`,
    command: `${usePrefix}:apple-keyboard-command`,
    ctrl: `${usePrefix}:apple-keyboard-control`,
    space: `${usePrefix}:keyboard-space`,
    shift: `${usePrefix}:apple-keyboard-shift`,
    alt: `${usePrefix}:apple-keyboard-option`,
    enter: `${usePrefix}:keyboard-return`,
    arrowup: `${usePrefix}:arrow-up`,
    arrowdown: `${usePrefix}:arrow-down`,
    arrowleft: `${usePrefix}:arrow-left`,
    arrowright: `${usePrefix}:arrow-right`,
    backspace: `${usePrefix}:backspace`,
    play: `${usePrefix}:play`,
    pause: `${usePrefix}:pause`,
    fullscreen: `${usePrefix}:fullscreen`,
    fullscreenExit: `${usePrefix}:fullscreen-exit`,
    volumeHigh: `${usePrefix}:volume-high`,
    volumeMedium: `${usePrefix}:volume-medium`,
    volumeLow: `${usePrefix}:volume-low`,
    volumeOff: `${usePrefix}:volume-variant-off`,
  }

  if (icons) {
    for (const [key, value] of Object.entries(icons)) {
      if (!(key in useIcons))
        continue
      let icon = value.startsWith(usePrefix) ? value.slice(usePrefix.length) : value
      if (icon[0] === '-' || icon[0] === ':') {
        icon = icon.slice(1)
      }
      useIcons[key as keyof typeof useIcons] = `${usePrefix}:${icon}`
    }
  }

  return useIcons
}

export function registerIconFonts(
  nuxt: Nuxt,
  options: ResolvedIcons,
) {
  /*
    // clear olf stuff: review this, I guess it is not required anymore => Nuxt will be restarted
    const oldCdnIcons = oldOptions?.cdn
    const oldHead = nuxt.options.app.head?.link
    if (oldCdnIcons && oldHead && oldHead.length > 0) {
      nuxt.options.app.head.link = oldHead.filter(link => !link.key || !oldCdnIcons.some(([key]) => link.key === key))
    }
    const oldLocalIcons = oldOptions?.local
    const oldCss = nuxt.options.css
    if (oldLocalIcons && oldCss && oldCss.length > 0) {
      nuxt.options.css = oldCss.filter(css => !oldLocalIcons.includes(css))
    }
  */
  // handle old stuff
  let links = nuxt.options.app.head?.link
  if (links) {
    const oldLinks = [...links]
    const newLinks: typeof links = []
    for (const link of oldLinks) {
      if (link.key) {
        const entry = link.key.match(/^vuetify-(.+)-icon-font$/)
        if (entry && iconsCDN[entry[1] as IconFontNameType]) {
          continue
        }
      }
      newLinks.push(link)
    }
    nuxt.options.app.head.link = newLinks
  }
  let css = nuxt.options.css
  if (css) {
    const oldCss = [...css]
    const newCss: typeof css = []
    for (const entry of oldCss) {
      if (IconsPackagesNames.has(entry)) {
        continue
      }
      newCss.push(entry)
    }
    nuxt.options.css = newCss
  }

  // handle new stuff
  if (options.fontIcons.size > 0) {
    nuxt.options.app.head ??= { link: [] }
    links = nuxt.options.app.head.link = nuxt.options.app.head.link ?? []
    for (const [key, href] of options.fontIcons) {
      links.push({
        key: `vuetify-${key}-icon-font`,
        rel: 'stylesheet',
        href,
        type: 'text/css',
        crossorigin: 'anonymous',
      })
    }
  }
  if (options.local.size > 0) {
    css = nuxt.options.css = nuxt.options.css ?? []
    for (const url of options.local.values()) {
      css.push(url)
    }
  }
}
