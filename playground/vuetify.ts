import type { VuetifyOptions } from 'vuetify'

const theme = {
  defaultTheme: 'light',
  themes: {
    light: {
      dark: false,
    },
    dark: {
      dark: true,
    },
  },
  variations: false,
} satisfies VuetifyOptions['theme']

export { theme }
export default theme
