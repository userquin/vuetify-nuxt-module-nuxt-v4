import type { Nuxt } from '@nuxt/schema'
import type { VuetifyNuxtContext } from './context'
import type { VuetifyModuleOptions } from './types'
import { addVitePlugin, updateTemplates } from '@nuxt/kit'
import { debounce } from 'perfect-debounce'
import { load } from './context'
import { addVuetifyNuxtTemplates } from './nuxt-templates'

interface HmrLoader {
  reload: () => Promise<any>
  client?: (() => Promise<any>) | undefined
  server?: (() => Promise<any>) | undefined
}

export function registerWatcher(
  options: VuetifyModuleOptions,
  nuxt: Nuxt,
  ctx: VuetifyNuxtContext,
) {
  if (ctx.isDev && ctx.vuetifyFilesToWatch.length > 0) {
    const hmrReload: HmrLoader = {
      async reload() {
        if (!this.client && !this.server)
          return await nuxt.callHook('restart')

        // avoid race condition between client and server
        if (this.server) {
          await this.server()
        }

        return await this.client?.()
      },
    }

    addVitePlugin({
      name: 'vuetify:configuration:watch',
      enforce: 'pre',
      async handleHotUpdate({ file }) {
        if (hmrReload && ctx.vuetifyFilesToWatch.includes(file)) {
          return await hmrReload.reload()
        }
      },
    })

    nuxt.hook('vite:serverCreated', (server, { isClient }) => {
      const key = isClient ? 'client' : 'server'
      hmrReload[key] = debounce(async () => {
        await load(options, nuxt, ctx)
        await addVuetifyNuxtTemplates(nuxt, ctx, true)
        await updateTemplates({
          filter: template => template.filename.startsWith('vuetify/'),
        })
      }, isClient ? 150 : 50, { trailing: false })
    })
  }
}
