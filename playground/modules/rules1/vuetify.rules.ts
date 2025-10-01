import type { ExternalLabsRulesOptions } from 'vuetify-nuxt-module/custom-labs-rules-configuration'
// import { defineVuetifyLabsRulesConfiguration } from 'vuetify-nuxt-module/custom-labs-rules-configuration'
import type { ValidationRuleBuilderWithoutOptions } from 'vuetify/labs/rules'

export const pinCode: ValidationRuleBuilderWithoutOptions = (err) => {
  return v => (/^\d{4}$/.test(v)) || err || 'Field must contain a 4-digit PIN'
}

export default {
  config: true,
  aliases: {
    pinCode,
  },
} satisfies ExternalLabsRulesOptions
