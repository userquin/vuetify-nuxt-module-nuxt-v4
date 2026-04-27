// import type { ExternalLabsRulesOptions } from 'vuetify-nuxt-module/custom-labs-rules-configuration'
import { defineVuetifyLabsRulesConfiguration } from 'vuetify-nuxt-module/custom-labs-rules-configuration'
import type { ValidationRuleBuilderWithoutOptions } from 'vuetify/labs/rules'
import { pinCode2 } from './vuetify-rules'

const pinCode: ValidationRuleBuilderWithoutOptions = (err) => {
  return v => (/^\d{4}$/.test(v)) || err || 'Field must contain a 4-digit PIN'
}
// const pinCode3 = { x: 2 } satisfies { x: number }
// const pinCode4 = { x: 2 } as const
export default defineVuetifyLabsRulesConfiguration({
  config: true,
  aliases: {
    pinCode,
    pinCode2,
  },
})
// export default {
//   config: true,
//   aliases: {
//     pinCode,
//   },
// } satisfies ExternalLabsRulesOptions
