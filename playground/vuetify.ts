import type { VuetifyOptions } from 'vuetify'

const theme: VuetifyOptions['theme'] = {
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
}

export { theme }
export default theme
