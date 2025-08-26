export default defineNuxtConfig({
  // loading: { color: '#fff' },

  css: ['@/assets/css/main.css'],

  devtools: {
    enabled: false,
  },

  modules: [
    '@nuxtjs/tailwindcss',
    '@nuxt/content',
    '@vueuse/nuxt',
    'nuxt-fathom',
    '@nuxt/image',
    '@nuxt/icon',
  ],

  nitro: {
    prerender: {
      routes: ['/'],
    },
  },

  fathom: {
    siteId: 'YQGQXJOE',
  },

  experimental: {
    typedPages: true,
  },

  typescript: {
    strict: true,
  },

  compatibilityDate: '2025-08-26',
})
