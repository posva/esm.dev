export default defineNuxtConfig({
  // loading: { color: '#fff' },

  app: {
    head: {
      htmlAttrs: {
        lang: 'en',
      },

      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      ],

      // these are for Safari 15 and Android Chrome
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'theme-color',
          content: '#121314',
          media: '(prefers-color-scheme: dark)',
        },
        {
          name: 'theme-color',
          content: '#efeeed',
          media: '(prefers-color-scheme: light)',
        },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
      ],
    },
  },

  css: ['@/assets/css/main.css'],

  modules: [
    '@nuxt/devtools',
    '@nuxtjs/tailwindcss',
    '@nuxt/content',
    'nuxt-icon',
    '@vueuse/nuxt',
  ],

  experimental: {
    typedPages: true,
  },

  content: {},
})
