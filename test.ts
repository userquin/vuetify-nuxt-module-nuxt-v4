import { readConfigurationFile, extractImports } from './src/utils'
import { parseModule } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'

async function test() {
  const content = await readConfigurationFile(
    'playground/layers/vuetify.rules',
  )
  const module = parseModule(content[1], {
    sourceFileName: content[0],
  })

  const rulesOptions = getDefaultExportOptions(module)
  const imports = []
  extractImports(
    imp => imports.push(imp),
    rulesOptions,
  )
  console.log('Imports:', imports)
}

test()
