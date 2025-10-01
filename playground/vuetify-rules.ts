import type { ValidationRuleBuilderWithoutOptions } from 'vuetify/labs/rules'

export const pinCode: ValidationRuleBuilderWithoutOptions = (err) => {
  return v => (/^\d{4}$/.test(v)) || err || 'Field must contain a 4-digit PIN'
}
