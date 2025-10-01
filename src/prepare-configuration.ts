import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { ProxifiedObject } from 'magicast'
import type { VuetifyOptions } from 'vuetify/framework'
import type { VuetifyNuxtContext, VuetifyOptionsInfo } from './context'
import type { ExternalVuetifyOptions, MOptions, VuetifyModuleOptions } from './types'
import fsp from 'node:fs/promises'
import { resolve } from 'pathe'
import defu from 'defu'
import { parseModule } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'
import { createImportMap, extractImports, mergeConfiguration, readConfigurationFile } from './utils'

export async function prepareConfiguration(
  nuxt: Nuxt,
  ctx: VuetifyNuxtContext,
  vuetifyConfigurationFilesToWatch: Set<string>,
  options: VuetifyModuleOptions,
) {
  const root = await loadRootLayer(
    nuxt,
    ctx,
    vuetifyConfigurationFilesToWatch,
    options,
  )

  let moduleOptions: MOptions = {}
  const layers = nuxt.options._layers.length

  if (layers === 1) {
    extractImports(
      (imp, impl) => ctx.imports.set(imp, impl),
      root.vuetifyOptions,
      root.importsMap,
    )
    ctx.moduleOptions = defu(options.moduleOptions ?? {}, moduleOptions)
    ctx.vuetifyOptions = root
    return
  }

  const inlineModules: MOptions[] = []
  let lastLayer: VuetifyOptionsInfo<VuetifyOptions> | undefined
  for (let i = layers - 1; i > 0; i--) {
    const layer = nuxt.options._layers[i]!
    const config = layer.config
    if (hasLayerVuetifyConfiguration(config)) {
      const mOptions = config.vuetify?.moduleOptions
      if (mOptions) {
        inlineModules.unshift(mOptions)
      }
    }
    const nextLayer = await loadLayer(
      nuxt,
      ctx,
      layer,
      vuetifyConfigurationFilesToWatch,
    )
    if (lastLayer) {
      if (nextLayer) {
        mergeConfiguration(
          (imp, impl) => ctx.imports.set(imp, impl),
          lastLayer.vuetifyOptions,
          nextLayer.vuetifyOptions,
          nextLayer.importsMap,
        )
      }
    }
    else {
      lastLayer = nextLayer
    }
  }

  if (lastLayer) {
    mergeConfiguration(
      (imp, impl) => ctx.imports.set(imp, impl),
      lastLayer.vuetifyOptions,
      root.vuetifyOptions,
      root.importsMap,
    )
    root.vuetifyOptions = lastLayer.vuetifyOptions
  }
  else {
    extractImports(
      (imp, impl) => ctx.imports.set(imp, impl),
      root.vuetifyOptions,
      root.importsMap,
    )
  }

  for (const mod of inlineModules.reverse()) {
    moduleOptions = defu(mod, moduleOptions)
  }

  ctx.moduleOptions = defu(options.moduleOptions, moduleOptions)
  ctx.vuetifyOptions = root
}

function hasLayerVuetifyConfiguration(
  config: NuxtConfigLayer['config'],
): config is NuxtConfigLayer['config'] & { vuetify?: VuetifyModuleOptions } {
  return 'vuetify' in config
}

function generateDefaultVuetifyOptions(): VuetifyOptionsInfo<VuetifyOptions> {
  const module = parseModule(`export default {}`)
  return {
    mode: 'default',
    vuetifyOptions: getDefaultExportOptions(module),
    module,
    importsMap: new Map(),
  }
}

async function loadExternalVuetifyConfiguration(
  nuxt: Nuxt,
  path: string,
): Promise<VuetifyOptionsInfo<ExternalVuetifyOptions>> {
  const content = await fsp.readFile(path, 'utf-8')
  const module = parseModule(content)
  return {
    path,
    mode: 'external',
    vuetifyOptions: getDefaultExportOptions(module),
    module,
    importsMap: createImportMap(nuxt, path, module),
  }
}

async function detectExternalVuetifyConfiguration(
  nuxt: Nuxt,
  root: string,
): Promise<VuetifyOptionsInfo<ExternalVuetifyOptions> | undefined> {
  const content = await readConfigurationFile(resolve(root, 'vuetify.config'))
  if (!content)
    return undefined

  const module = parseModule(content[1])
  return {
    path: content[0],
    mode: 'external',
    vuetifyOptions: getDefaultExportOptions(module),
    module,
    importsMap: createImportMap(nuxt, content[0], module),
  }
}

async function loadNuxtVuetifyConfiguration(
  nuxt: Nuxt,
  root: string,
): Promise<VuetifyOptionsInfo<VuetifyOptions> | undefined> {
  const content = await readConfigurationFile(resolve(root, 'nuxt.config'))
  if (!content) {
    return generateDefaultVuetifyOptions()
  }

  let module = parseModule(content[1])
  const config = getDefaultExportOptions(
    module,
  ) as ProxifiedObject<{
    vuetify?: { vuetifyOptions?: VuetifyOptions }
  }>

  let vuetifyOptions = config.vuetify?.vuetifyOptions
  if (!vuetifyOptions) {
    ({ module, vuetifyOptions } = generateDefaultVuetifyOptions())
  }

  return {
    path: vuetifyOptions ? content[0] : undefined,
    mode: 'inline',
    module,
    vuetifyOptions,
    importsMap: vuetifyOptions ? createImportMap(nuxt, content[0], module) : new Map(),
  }
}

function mergeExternalOptions(external: VuetifyOptionsInfo<ExternalVuetifyOptions> | undefined) {
  if (!external)
    return false

  const config = external.vuetifyOptions.config
  delete external.vuetifyOptions.config
  return config !== false
}

async function loadLayerConfiguration(
  nuxt: Nuxt,
  root: string,
  ctx: VuetifyNuxtContext,
  vuetifyConfigurationFilesToWatch: Set<string>,
  vuetifyOptions?: string | VuetifyOptions,
): Promise<VuetifyOptionsInfo<VuetifyOptions>> {
  let external: VuetifyOptionsInfo<ExternalVuetifyOptions> | undefined
  if (typeof vuetifyOptions === 'string') {
    external = await loadExternalVuetifyConfiguration(nuxt, vuetifyOptions)
    if (external) {
      vuetifyConfigurationFilesToWatch.add(vuetifyOptions)
    }
  }
  else {
    external = await detectExternalVuetifyConfiguration(nuxt, root)
    if (external?.path) {
      vuetifyConfigurationFilesToWatch.add(external.path)
    }
  }

  if (!vuetifyOptions && !external) {
    return generateDefaultVuetifyOptions()
  }

  // load inline configuration from the nuxt.config file
  const inline = vuetifyOptions
    ? await loadNuxtVuetifyConfiguration(nuxt, root)
    : undefined

  if (!inline) {
    if (external) {
      ctx.vuetifyOptionsModules.push(external)
    }
    return mergeExternalOptions(external)
      ? external!
      : generateDefaultVuetifyOptions()
  }

  ctx.vuetifyOptionsModules.push(inline)

  if (mergeExternalOptions(external)) {
    ctx.vuetifyOptionsModules.push(external!)
    mergeConfiguration(
      (imp, impl) => ctx.imports.set(imp, impl),
      inline.vuetifyOptions,
      external!.vuetifyOptions,
      external!.importsMap,
    )
  }

  return inline
}

async function loadRootLayer(
  nuxt: Nuxt,
  ctx: VuetifyNuxtContext,
  vuetifyConfigurationFilesToWatch: Set<string>,
  { vuetifyOptions }: VuetifyModuleOptions,
) {
  return await loadLayerConfiguration(
    nuxt,
    nuxt.options.rootDir,
    ctx,
    vuetifyConfigurationFilesToWatch,
    vuetifyOptions,
  )
}

async function loadLayer(
  nuxt: Nuxt,
  ctx: VuetifyNuxtContext,
  layer: NuxtConfigLayer,
  vuetifyConfigurationFilesToWatch: Set<string>,
) {
  const config = layer.config
  return await loadLayerConfiguration(
    nuxt,
    config.rootDir,
    ctx,
    vuetifyConfigurationFilesToWatch,
    hasLayerVuetifyConfiguration(config)
      ? config.vuetify?.vuetifyOptions
      : undefined,
  )
}
