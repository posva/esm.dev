export default defineNuxtConfig({
  // loading: { color: '#fff' },

  css: ['@/assets/css/main.css'],

  modules: ['@nuxtjs/tailwindcss', '@nuxt/content'],

  experimental: {
    typedPages: true,
  },

  content: {},
})
