import type { Nuxt } from '@nuxt/schema'
import type { VuetifyNuxtContext } from './context'
import type { VuetifyModuleOptions } from './types'
import { normalize, resolve } from 'pathe'
import { addVitePlugin, isIgnored } from '@nuxt/kit'
import { watch as chokidarWatch } from 'chokidar'
import { debounce } from 'perfect-debounce'
import { load } from './context'

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
    /* nuxt.hooks.hook('builder:watch', async (_event, path) => {
      path = resolve(nuxt.options.srcDir, path)
      console.log(path)
      console.log(ctx.vuetifyFilesToWatch.includes(path))
      /!* if (ctx.vuetifyFilesToWatch.includes(path)) {
        return await hmrReload.reload()
      } *!/
    })

    if (true) {
      return
    } */
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
    if (false/* nuxt.options.future?.compatibilityVersion === 4 */) {
      const watcher = chokidarWatch(
        ctx.vuetifyFilesToWatch.map(f => normalize(resolve(nuxt.options.srcDir, f))),
        {
          awaitWriteFinish: true,
          ignoreInitial: true,
          ignored: [isIgnored, 'node_modules'],
        },
      )

      watcher.on('all', (event, path) => {
        if (event === 'all' || event === 'ready' || event === 'error' || event === 'raw') {
          return
        }
        nuxt.callHook('builder:watch', event, normalize(path))
      })
      nuxt.hook('close', () => watcher?.close())
      nuxt.hooks.hook('builder:watch', async (_event, path) => {
        path = normalize(resolve(nuxt.options.srcDir, path))
        if (ctx.vuetifyFilesToWatch.includes(path)) {
          return await hmrReload.reload()
        }
      })
    }
    else {
      /* nuxt.hooks.hook('builder:watch', async (_event, path) => {
        path = resolve(nuxt.options.srcDir, path)
        console.log(path)
        console.log(ctx.vuetifyFilesToWatch.includes(path))
        if (ctx.vuetifyFilesToWatch.includes(path)) {
          return await hmrReload.reload()
        }
      }) */
      addVitePlugin({
        name: 'vuetify:configuration:watch',
        enforce: 'pre',
        async handleHotUpdate({ file, modules, server }) {
          console.log(modules.map(m => [m.id, m.file] as const))
          /* if (ctx.vuetifyFilesToWatch.includes(file)) {
            for (const mod of modules) {
              server.moduleGraph.invalidateModule(mod)
              await server.reloadModule(mod)
            }
            server.ws.send({ type: 'full-reload' })
            return []
          }
          return [] */
          if (hmrReload && ctx.vuetifyFilesToWatch.includes(file)) {
            return await hmrReload.reload()
          }
        },
      })
    }

    nuxt.hook('vite:serverCreated', (server, { isClient, isServer }) => {
      const key = isClient ? 'client' : 'server'
      hmrReload[key] = debounce(async () => {
        // reload configuration only on ssr or if not ssr app
        // if (isServer || !nuxt.options.ssr) {
        // if (isClient) {
        await load(options, nuxt, ctx)
        // }
        // }
        /* const moduleGraph = server./!* environments[isClient ? 'client' : 'ssr']. *!/moduleGraph
        const modules = Array.from(
          moduleGraph.idToModuleMap.entries(),
        ).filter(m => m[0]?.startsWith('virtual:nuxt:') && (
          m[0]?.endsWith('vuetify/configuration.mjs')
          || m[0]?.endsWith('vuetify/labs-rules-configuration.mjs')
          || m[0]?.endsWith('vuetify/rules-configuration.mjs')
          || m[0]?.endsWith('vuetify/ssr-client-hints-configuration.mjs')
        ))
        console.log(modules?.map(m => m[1])) */
        if (/* modules && */server.ws) {
          // for (const mod of modules) {
          //   moduleGraph.invalidateModule(mod[1])
          // }
          // remove this event when vuetify can reload configuration
          // add import.meta.hot back in the nuxt plugins at nuxt-templates.ts module
          server.ws.send({ type: 'full-reload' })
          return []
        }
        else {
          return await nuxt.callHook('restart')
        }
      }, isClient ? 150 : 50, { trailing: false })
    })
  }
}
