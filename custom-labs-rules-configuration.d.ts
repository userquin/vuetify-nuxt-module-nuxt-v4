import type { RulesOptions as LabsRulesOptions } from 'vuetify/labs/rules'

export type { LabsRulesOptions }
export interface ExternalLabsRulesOptions extends LabsRulesOptions {
  /**
   * Merge the rules from this module.
   */
  config: boolean
}

declare function defineVuetifyLabsRulesConfiguration(rulesOptions: ExternalLabsRulesOptions): ExternalLabsRulesOptions
export { defineVuetifyLabsRulesConfiguration }
