import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { createVuetify } from 'vuetify'
import { aliases, mdi } from 'vuetify/iconsets/mdi'
import App from './App.vue'
import { lotusTheme, darkTheme, lightTheme } from './themes'

import 'vuetify/styles'
import '@mdi/font/css/materialdesignicons.css'

const vuetify = createVuetify({
  icons: { defaultSet: 'mdi', aliases, sets: { mdi } },
  theme: {
    defaultTheme: 'light',
    themes: { lotus: lotusTheme, dark: darkTheme, light: lightTheme },
  },
})

const pinia = createPinia()
const app = createApp(App)
app.use(pinia)
app.use(vuetify)
app.mount('#app')
