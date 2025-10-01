import type { Nuxt } from '@nuxt/schema'
import type { ResolvedIcons } from './types'

export function registerIconFonts(
  nuxt: Nuxt,
  options: ResolvedIcons,
  oldOptions?: ResolvedIcons,
) {
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

  // handle new stuff
  if (options.cdn.length > 0) {
    nuxt.options.app.head ??= { link: [] }
    const links = nuxt.options.app.head.link = nuxt.options.app.head.link ?? []
    for (const [key, href] of Object.values(options.cdn)) {
      links.push({
        key,
        rel: 'stylesheet',
        href,
        type: 'text/css',
        crossorigin: 'anonymous',
      })
    }
  }
  if (options.local.length > 0) {
    const css = nuxt.options.css = nuxt.options.css ?? []
    for (const url of Object.values(options.local)) {
      css.push(url)
    }
  }
}
