export default defineNuxtConfig({
  // loading: { color: '#fff' },

  css: ['@/assets/css/main.css'],

  modules: [
    '@nuxtjs/tailwindcss',
    // '@nuxt/content',
    'nuxt-icon',
    '@vueuse/nuxt',
  ],

  experimental: {
    typedPages: true,
  },

  content: {},
})
