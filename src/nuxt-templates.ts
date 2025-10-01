import type { Nuxt } from '@nuxt/schema'
import type { VuetifyNuxtContext } from './context'
import { addTemplate } from '@nuxt/kit'
import { generateCode } from 'magicast'

export function addVuetifyNuxtTemplates(
  nuxt: Nuxt,
  ctx: VuetifyNuxtContext,
) {
  addTemplate({
    filename: 'vuetify/configuration.mjs',
    write: true,
    getContents: () => generateVuetifyConfiguration(ctx),
  })

  if (ctx.ssrClientHints.enabled) {
    addTemplate({
      filename: 'vuetify/ssr-client-hints-configuration.mjs',
      write: true,
      getContents: () => generateVuetifyClientHintsConfiguration(ctx),
    })
  }
}

function generateVuetifyConfiguration(ctx: VuetifyNuxtContext) {
  return `${ctx.configurationImports}export function vuetifyConfiguration() {
  return ${generateCode(ctx.vuetifyOptions.vuetifyOptions).code}
}
`
}

function generateVuetifyClientHintsConfiguration(ctx: VuetifyNuxtContext) {
  const ssr = ctx.vuetifyOptions.vuetifyOptions.ssr
  const clientWidth = typeof ssr === 'boolean' ? undefined : ssr?.clientWidth
  const clientHeight = typeof ssr === 'boolean' ? undefined : ssr?.clientHeight
  const data: Record<string, any> = {
    reloadOnFirstRequest: ctx.ssrClientHints.reloadOnFirstRequest,
    viewportSize: ctx.ssrClientHints.viewportSize,
    prefersColorScheme: ctx.ssrClientHints.prefersColorScheme,
    prefersReducedMotion: ctx.ssrClientHints.prefersReducedMotion,
    clientWidth,
    clientHeight,
    prefersColorSchemeOptions: ctx.ssrClientHints.prefersColorSchemeOptions,
  }

  return `export const ssrClientHintsConfiguration = JSON.parse('${JSON.stringify(data)}');`
}
