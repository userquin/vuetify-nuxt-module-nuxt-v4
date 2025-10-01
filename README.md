# New vuetify-nuxt module for Nuxt 4 and Vuetify 3.10

This repository will be moved later to the official [Vuetify Nuxt Module repository](https://github.com/vuetifyjs/nuxt-module).

Added missing composables from 3.18 to 3.10 versions:
- `useHotkey` ( from Vuetify v3.8.0)
- `useMask` (from Vuetify v3.10.0)
- `useRules` (from Vuetify v3.8.0 from labs => `vuetify/labs/composables`)

This new version includes:
- use [@unvuetify-monorepo](https://github.com/userquin/unvuetify-monorepo) utilities, check the [package features comparison](https://github.com/userquin/unvuetify-monorepo?tab=readme-ov-file#-package-features-comparison) in the readme file
- removed all Vite plugins, now the configuration is merged directly and exposed by Nuxt "virtual" modules and now it is statically analizable:
  - use `#build/vuetify/configuration.mjs` to access the configuration
  - `#build/vuetify/ssr-client-hints-configuration.mjs` to access the SSR Client hints configuration
  - use `defineVuetifyConfiguration` from `vuetify-nuxt-module/custom-configuration` to add `vuetify.config.[m][tj]s` file at Nuxt root folder or layers.
- added support for the new [Vuetify validation rules](https://vuetifyjs.com/en/features/rules/#validation-rules):
  - use `#build/vuetify/labs-rules-configuration.mjs` to access the configuration
  - use `defineVuetifyLabsRulesConfiguration` from `vuetify-nuxt-module/custom-labs-rules-configuration` to add `vuetify.rules.[m][tj]s` file at Nuxt root folder or layers
  - enable the new `enableVuetifyRules` option, and the module will register the Vuetify Vue Rules plugin for you

The new module still have the existing Nuxt Runtime Hooks: check [types.ts][./src/types.ts] file for more information.

The new configuration using `AsyncGenerators` to load the configuration files, check [load-configuration.ts](./src/load-configuration.ts) module.

## Playgrounds

You can play here with the playground workspace (latest Nuxt 4 with Nuxt 3 layout):
- `pnpm install --fronze-lockfile`
- `pnpm dev:prepare` to prepare the playground
- `pnpm dev` to start the Nuxt development server

You can also play with [this Nuxt 4 playground repository](https://github.com/userquin/vuetify-nuxt-module-nuxt-v4-playground) with latest Nuxt 4 layout, using local .tgz file from this respository and `pkg-pr-new` dependencies from [this PR](https://github.com/userquin/unvuetify-monorepo/pull/51) at `@unvuetify-monorepo` (will be merged and released a new version soon):
- `pnpm install --fronze-lockfile`
- `pnpm dev:prepare` to prepare the playground
- `pnpm dev` to start the Nuxt development server
