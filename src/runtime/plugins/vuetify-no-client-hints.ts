import type { Plugin } from '#app'
import type { UnwrapNestedRefs } from 'vue'
import type { SSRClientHints } from './types'
import { defineNuxtPlugin } from '#imports'
import { reactive } from 'vue'

// @ts-expect-error no idea why cannot infer types here
const plugin: Plugin<{
  ssrClientHints: UnwrapNestedRefs<SSRClientHints>
}> = defineNuxtPlugin({
  name: 'vuetify:no-client-hints:plugin',
  parallel: true,
  setup() {
    return {
      provide: reactive({
        ssrClientHints: {
          firstRequest: false,
          prefersColorSchemeAvailable: false,
          prefersReducedMotionAvailable: false,
          viewportHeightAvailable: false,
          viewportWidthAvailable: false,
        },
      }),
    }
  },
})

export default plugin
