import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { VuetifyNuxtContext, VuetifyRules, VuetifyRulesInfo } from './context'
import { createImportMap, extractImports, mergeConfiguration, readConfigurationFile } from './utils'
import { resolve } from 'pathe'
import { parseModule } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'

export interface ExternalVuetifyRules extends VuetifyRules {
  config?: boolean
}

export async function prepareRulesConfiguration(
  nuxt: Nuxt,
  ctx: VuetifyNuxtContext,
  vuetifyConfigurationFilesToWatch: Set<string>,
) {
  if (!ctx.enableRules) {
    return
  }

  // detect here package import: transpile, node types and configuration imports
  // use vuetify version or local-pkg => isPackageExists (vuetify/labs/rules or vuetify/rules)

  const defRules = generateDefaultRulesOptions()
  const root = await loadRootLayer(
    nuxt,
    ctx,
    vuetifyConfigurationFilesToWatch,
  )

  const layers = nuxt.options._layers.length

  if (layers === 1) {
    extractImports(
      (imp, impl) => ctx.rulesConfiguration.rulesImports.set(imp, impl),
      root.rulesOptions,
      root.importsMap,
    )
    ctx.rulesConfiguration.rulesOptions = root.rulesOptions
    return
  }

  const lastLayer: VuetifyRulesInfo = defRules
  for (let i = layers - 1; i > 0; i--) {
    const layer = nuxt.options._layers[i]!
    const nextLayer = await loadLayer(
      nuxt,
      layer,
      ctx,
      vuetifyConfigurationFilesToWatch,
    )
    if (nextLayer) {
      mergeConfiguration(
        (imp, impl) => ctx.rulesConfiguration.rulesImports.set(imp, impl),
        lastLayer.rulesOptions,
        nextLayer.rulesOptions,
        nextLayer.importsMap,
      )
    }
  }

  if (lastLayer) {
    mergeConfiguration(
      (imp, impl) => ctx.rulesConfiguration.rulesImports.set(imp, impl),
      lastLayer.rulesOptions,
      root.rulesOptions,
      root.importsMap,
    )
  }
  ctx.rulesConfiguration.rulesOptions = root.rulesOptions
}

function generateDefaultRulesOptions(): VuetifyRulesInfo {
  const module = parseModule(`export default { ruleOptions: {} }`)
  return {
    mode: 'default',
    rulesOptions: getDefaultExportOptions(module),
    module,
    importsMap: new Map(),
  }
}

async function loadLayerConfiguration(
  nuxt: Nuxt,
  root: string,
  ctx: VuetifyNuxtContext,
  vuetifyConfigurationFilesToWatch: Set<string>,
): Promise<VuetifyRulesInfo> {
  const external = await detectExternalRulesConfiguration(nuxt, root)
  if (external?.path) {
    vuetifyConfigurationFilesToWatch.add(external.path)
  }

  if (external?.mode === 'external') {
    ctx.rulesConfiguration.externalRules.push(external)
  }

  return external
}

async function loadLayer(
  nuxt: Nuxt,
  layer: NuxtConfigLayer,
  ctx: VuetifyNuxtContext,
  vuetifyConfigurationFilesToWatch: Set<string>,
): Promise<VuetifyRulesInfo> {
  return await loadLayerConfiguration(
    nuxt,
    layer.config.rootDir,
    ctx,
    vuetifyConfigurationFilesToWatch,
  )
}

async function loadRootLayer(
  nuxt: Nuxt,
  ctx: VuetifyNuxtContext,
  vuetifyConfigurationFilesToWatch: Set<string>,
): Promise<VuetifyRulesInfo> {
  return await loadLayerConfiguration(
    nuxt,
    nuxt.options.rootDir,
    ctx,
    vuetifyConfigurationFilesToWatch,
  )
}

async function detectExternalRulesConfiguration(
  nuxt: Nuxt,
  root: string,
): Promise<VuetifyRulesInfo> {
  const content = await readConfigurationFile(resolve(root, 'vuetify.rules'))
  if (!content) {
    return generateDefaultRulesOptions()
  }

  const module = parseModule<ExternalVuetifyRules>(content[1], {
    sourceFileName: content[0],
  })

  const rulesOptions = getDefaultExportOptions(module)
  if (!rulesOptions.config) {
    return generateDefaultRulesOptions()
  }

  delete rulesOptions.config

  return {
    mode: 'external',
    path: content[0],
    rulesOptions,
    module,
    importsMap: createImportMap(nuxt, content[0], module),
  }
}
