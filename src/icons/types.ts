import type { IconSetNameType, UnoCSSMdiIconSet } from '../types'

export interface ResolvedIcons {
  enabled: boolean
  registerIconsPlugin: boolean
  unocss: boolean
  unocssAliases: boolean
  unocssIconPrefix: string
  unocssIconCollection: string
  unocssIcons: UnoCSSMdiIconSet
  unocssAdditionalIcons: Record<string, string>
  defaultSet?: IconSetNameType
  sets: string[]
  cdn: [key: string, cdn: string][]
  local: string[]
  aliases: string[]
  aliasesImportPresent: boolean
  imports: string[]
  svg: {
    mdi?: boolean
    fa?: string[]
  }
}
