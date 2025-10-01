import type { Nuxt, NuxtConfigLayer } from '@nuxt/schema'
import type { ProxifiedObject } from 'magicast'
import type { VuetifyOptions } from 'vuetify/framework'
import type { VuetifyNuxtContext, VuetifyOptionsInfo } from './context'
import type { ExternalVuetifyOptions, MOptions, VuetifyModuleOptions } from './types'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { resolve } from 'node:path'
import defu from 'defu'
import { parseModule } from 'magicast'
import { getDefaultExportOptions } from 'magicast/helpers'

export async function prepareConfiguration(
  nuxt: Nuxt,
  ctx: VuetifyNuxtContext,
  vuetifyConfigurationFilesToWatch: Set<string>,
  options: VuetifyModuleOptions,
) {
  let inlineModules: MOptions[] = []
  await nuxt.callHook(
    'vuetify:registerModule',
    ({ moduleOptions }) => (moduleOptions && inlineModules.push(moduleOptions)),
  )

  const root = await loadRootLayer(
    nuxt,
    ctx,
    vuetifyConfigurationFilesToWatch,
    options,
  )

  let moduleOptions: MOptions = {}
  for (const mod of inlineModules) {
    moduleOptions = defu(mod, moduleOptions)
  }

  const layers = nuxt.options._layers.length

  if (layers === 1) {
    ctx.moduleOptions = defu(options.moduleOptions ?? {}, moduleOptions)
    ctx.vuetifyOptions = root
    return
  }

  inlineModules = []

  let lastLayer: VuetifyOptionsInfo<VuetifyOptions> | undefined
  for (let i = layers - 1; i > 0; i--) {
    const layer = nuxt.options._layers[i]
    const config = layer.config
    if (hasLayerVuetifyConfiguration(config)) {
      const mOptions = config.vuetify?.moduleOptions
      if (mOptions) {
        inlineModules.unshift(mOptions)
      }
    }
    const nextLayer = await loadLayer(
      ctx,
      layer,
      vuetifyConfigurationFilesToWatch,
    )
    if (lastLayer) {
      if (nextLayer) {
        mergeConfiguration(ctx, lastLayer.vuetifyOptions, nextLayer.vuetifyOptions)
      }
    }
    else {
      lastLayer = nextLayer
    }
  }

  if (lastLayer) {
    mergeConfiguration(ctx, lastLayer.vuetifyOptions, root.vuetifyOptions)
    root.vuetifyOptions = lastLayer.vuetifyOptions
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

async function readFile(
  path: string,
  extensions = ['mts', 'ts', 'mjs', 'js'],
): Promise<[path: string, content: string, type: 'js' | 'ts'] | undefined> {
  for (const ext of extensions) {
    const filePath = `${path}.${ext}`
    try {
      await fsp.access(filePath, fs.constants.R_OK)
      return [
        filePath,
        await fsp.readFile(filePath, 'utf-8'),
        ext === 'js' || ext === 'mjs' ? 'js' : 'ts',
      ]
    }
    catch {}
  }

  return undefined
}

function generateDefaultVuetifyOptions(): VuetifyOptionsInfo<VuetifyOptions> {
  const module = parseModule(`export default {}`)
  return {
    mode: 'default',
    vuetifyOptions: getDefaultExportOptions(module),
    module,
  }
}

async function loadExternalVuetifyConfiguration(
  path: string,
): Promise<VuetifyOptionsInfo<ExternalVuetifyOptions>> {
  const content = await fsp.readFile(path, 'utf-8')
  const module = parseModule(content)
  return {
    path,
    mode: 'external',
    vuetifyOptions: getDefaultExportOptions(module),
    module,
  }
}

async function detectExternalVuetifyConfiguration(
  root: string,
): Promise<VuetifyOptionsInfo<ExternalVuetifyOptions> | undefined> {
  const content = await readFile(resolve(root, 'vuetify.config'))
  if (!content)
    return undefined

  const module = parseModule(content[1])
  return {
    path: content[0],
    mode: 'external',
    vuetifyOptions: getDefaultExportOptions(module),
    module,
  }
}

async function loadNuxtVuetifyConfiguration(
  root: string,
): Promise<VuetifyOptionsInfo<VuetifyOptions> | undefined> {
  const content = await readFile(resolve(root, 'nuxt.config'))
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
  }
}

function mergeExternalOptions(external: VuetifyOptionsInfo<ExternalVuetifyOptions> | undefined) {
  if (!external)
    return false

  const config = external.vuetifyOptions.config
  delete external.vuetifyOptions.config
  return config !== false
}

function extractImports(ctx: VuetifyNuxtContext, obj: ProxifiedObject<any>) {
  for (const [_, value] of Object.entries(obj)) {
    if (!value.$ast?.type)
      continue

    if (value.$ast.type === 'Identifier') {
      ctx.imports.add(value.$ast.name)
      continue
    }
    if (value.$ast.type === 'MemberExpression') {
      if (value.$ast.object.type === 'Identifier' && value.$ast.property.type === 'Identifier') {
        ctx.imports.add(value.$ast.object.name)
        continue
      }
    }
    if (value.$ast.type === 'ObjectExpression') {
      extractImports(ctx, value)
    }
  }
}

function mergeConfiguration(
  ctx: VuetifyNuxtContext,
  first: ProxifiedObject<any>,
  last: ProxifiedObject<any>,
) {
  const seen = new Set<string>()
  for (const [key, value] of Object.entries(last)) {
    seen.add(key)
    if (!value.$ast?.type) {
      first[key] = value
      continue
    }
    // import specifier => blueprint or date adapter for example
    if (value.$ast.type === 'Identifier') {
      // add the specifier to the imports
      ctx.imports.add(value.$ast.name)
      first[key] = value
      continue
    }
    if (value.$ast.type === 'MemberExpression') {
      if (value.$ast.object.type === 'Identifier' && value.$ast.property.type === 'Identifier') {
        ctx.imports.add(value.$ast.object.name)
        first[key] = value
        continue
      }
    }
    // we need to merge data only when both are objects
    if (value.$ast.type === 'ObjectExpression') {
      if (key in first) {
        if (first[key].$ast.type === 'ObjectExpression') {
          // merge the child object
          mergeConfiguration(ctx, first[key], value)
        }
        else {
          if (value.$ast) {
            extractImports(ctx, value)
          }
          first[key] = value
        }
      }
      else {
        extractImports(ctx, value)
        first[key] = value
      }
      continue
    }
    // in any other case we just replace the value
    first[key] = value
  }

  // we need to traverse the first object to find any missing imports
  for (const key of Object.keys(first)) {
    if (seen.has(key))
      continue

    const value = first[key]
    if (!value.$ast?.type) {
      continue
    }

    if (value.$ast.type === 'Identifier') {
      ctx.imports.add(value.$ast.name)
      continue
    }
    if (value.$ast.type === 'MemberExpression') {
      if (value.$ast.object.type === 'Identifier' && value.$ast.property.type === 'Identifier') {
        ctx.imports.add(value.$ast.object.name)
        continue
      }
    }
    if (value.$ast.type === 'ObjectExpression') {
      extractImports(ctx, value)
    }
  }
}

async function loadLayerConfiguration(
  root: string,
  ctx: VuetifyNuxtContext,
  vuetifyConfigurationFilesToWatch: Set<string>,
  vuetifyOptions?: string | VuetifyOptions,
): Promise<VuetifyOptionsInfo<VuetifyOptions>> {
  let external: VuetifyOptionsInfo<ExternalVuetifyOptions> | undefined
  if (typeof vuetifyOptions === 'string') {
    external = await loadExternalVuetifyConfiguration(vuetifyOptions)
    if (external) {
      vuetifyConfigurationFilesToWatch.add(vuetifyOptions)
    }
  }
  else {
    external = await detectExternalVuetifyConfiguration(root)
    if (external?.path) {
      vuetifyConfigurationFilesToWatch.add(external.path)
    }
  }

  if (!vuetifyOptions && !external) {
    return generateDefaultVuetifyOptions()
  }

  // load inline configuration from the nuxt.config file
  const inline = vuetifyOptions
    ? await loadNuxtVuetifyConfiguration(root)
    : undefined

  if (!inline) {
    if (external) {
      ctx.vuetifyOptionsModules.push(external.module)
    }
    return mergeExternalOptions(external)
      ? external!
      : generateDefaultVuetifyOptions()
  }

  ctx.vuetifyOptionsModules.push(inline.module)

  if (mergeExternalOptions(external)) {
    ctx.vuetifyOptionsModules.push(external!.module)
    mergeConfiguration(ctx, inline.vuetifyOptions, external!.vuetifyOptions)
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
    nuxt.options.rootDir,
    ctx,
    vuetifyConfigurationFilesToWatch,
    vuetifyOptions,
  )
}

async function loadLayer(
  ctx: VuetifyNuxtContext,
  layer: NuxtConfigLayer,
  vuetifyConfigurationFilesToWatch: Set<string>,
) {
  const config = layer.config
  return await loadLayerConfiguration(
    config.rootDir,
    ctx,
    vuetifyConfigurationFilesToWatch,
    hasLayerVuetifyConfiguration(config)
      ? config.vuetify?.vuetifyOptions
      : undefined,
  )
}
