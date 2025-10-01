import ar from '../locales/ar'
import en from '../locales/en'
import es from '../locales/es'

export default defineI18nConfig(() => {
  return {
    legacy: false,
    locale: 'en-US',
    messages: {
      'en-US': en,
      'en-UK': en,
      'es-ES': es,
      'es-CO': es,
      'ar-EG': ar,
    },
  }
})
