import { defineVuetifyLabsRulesConfiguration } from 'vuetify-nuxt-module/custom-labs-rules-configuration'
import { pinCode } from './vuetify-rules'

export default defineVuetifyLabsRulesConfiguration({
  config: true,
  aliases: {
    pinCode,
  },
})

// import { defineVuetifyLabsRulesConfiguration } from 'vuetify-nuxt-module/custom-labs-rules-configuration'
// // import type { ValidationRuleBuilderWithoutOptions } from 'vuetify/labs/rules'
//
// export default defineVuetifyLabsRulesConfiguration({
//   config: true,
//   aliases: {
//     /** @type {import('vuetify/labs/rules').ValidationRuleBuilderWithoutOptions} */
//     pinCode(err) {
//       return v => (/^\d{4}$/.test(v)) || err || 'Field must contain a 4-digit PIN'
//     },
//   },
// })
