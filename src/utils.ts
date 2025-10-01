import fs from 'node:fs'
import fsp from 'node:fs/promises'
import type { Nuxt } from '@nuxt/schema'
import type { ProxifiedModule, ProxifiedObject } from 'magicast'
import { dirname, relative, resolve } from 'pathe'
import type { Import } from './context'

export async function readConfigurationFile(
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
    catch {
      // just ignore
    }
  }

  return undefined
}

export function createImportMap(
  nuxt: Nuxt,
  path: string,
  module: ProxifiedModule,
) {
  const importsMap = new Map<string, Import>()
  for (const { from, imported, local } of Object.values(module.imports)) {
    let useFrom = from
    if (from[0] === '.') {
      useFrom = relative(resolve(nuxt.options.buildDir, 'vuetify'), resolve(dirname(path), from)).replace(/\\/g, '/')
    }
    importsMap.set(local, { from: useFrom, imported, local })
  }
  return importsMap
}

export function mergeConfiguration(
  addImport: (imp: string, impl: Import) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  first: ProxifiedObject<any>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  last: ProxifiedObject<any>,
  imports: Map<string, Import>,
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
      addImport(value.$ast.name, imports.get(value.$ast.name)!)
      first[key] = value
      continue
    }
    if (value.$ast.type === 'MemberExpression') {
      if (value.$ast.object.type === 'Identifier' && value.$ast.property.type === 'Identifier') {
        addImport(value.$ast.object.name, imports.get(value.$ast.object.name)!)
        first[key] = value
        continue
      }
    }
    // we need to merge data only when both are objects
    if (value.$ast.type === 'ObjectExpression') {
      if (first[key]) {
        if (first[key].$ast.type === 'ObjectExpression') {
          // merge the child object
          mergeConfiguration(addImport, first[key], value, imports)
        }
        else {
          if (value.$ast) {
            extractImports(addImport, value, imports)
          }
          first[key] = value
        }
      }
      else {
        extractImports(addImport, value, imports)
        first[key] = value
      }
      continue
    }
    // todo: handle arrays => icons can be a pain
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
      addImport(value.$ast.name, imports.get(value.$ast.name)!)
      continue
    }
    if (value.$ast.type === 'MemberExpression') {
      if (value.$ast.object.type === 'Identifier' && value.$ast.property.type === 'Identifier') {
        addImport(value.$ast.object.name, imports.get(value.$ast.object.name)!)
        continue
      }
    }
    if (value.$ast.type === 'ObjectExpression') {
      extractImports(addImport, value, imports)
    }
  }
}

export function extractImports(
  addImport: (imp: string, impl: Import) => void,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  obj: ProxifiedObject<any>,
  imports: Map<string, Import>,
) {
  for (const [_, value] of Object.entries(obj)) {
    if (!value.$ast?.type)
      continue

    if (value.$ast.type === 'Identifier') {
      addImport(value.$ast.name, imports.get(value.$ast.name)!)
      continue
    }
    if (value.$ast.type === 'MemberExpression') {
      if (value.$ast.object.type === 'Identifier' && value.$ast.property.type === 'Identifier') {
        addImport(value.$ast.object.name, imports.get(value.$ast.object.name)!)
        continue
      }
    }
    if (value.$ast.type === 'ObjectExpression') {
      extractImports(addImport, value, imports)
    }
  }
}
