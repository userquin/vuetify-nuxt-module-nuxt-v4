import type { ValidationRuleBuilderWithoutOptions } from 'vuetify/labs/rules'

export const pinCode2: ValidationRuleBuilderWithoutOptions = (err) => {
  return v => (/^\d{5}$/.test(v)) || err || 'Field must contain a 5-digit PIN'
}
