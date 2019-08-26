import { Configuration } from '@nuxt/types'

const config: Configuration = {
  mode: 'universal',

  head: {
    title: 'Eduardo San Martin Morote',

    htmlAttrs: {
      lang: 'en',
    },

    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: `Eduardo's personal website`,
      },
      // <meta name="theme-color" content="black" />
      // <meta name="msapplication-navbutton-color" content="black" />
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      // <meta name="apple-mobile-web-app-status-bar-style" content="black" />

      // Open Graph data
      { property: 'og:title', content: 'Eduardo San Martin Morote' },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://esm.dev' },
      { property: 'og:image', content: 'https://esm.dev/media-preview.jpg' },
      { property: 'og:description', content: 'Hello! I am Eduardo,' },
      // Twitter Card data
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:site', content: '@posva' },
      { name: 'twitter:creator', content: '@posva' },
      { name: 'twitter:title', content: 'Eduardo San Martin Morote' },
      { name: 'twitter:description', content: 'Hello! I am Eduardo.' },
      { name: 'twitter:image', content: 'https://esm.dev/media-preview.jpg' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'icon', type: 'image/png', href: '/favicon.png' },
    ],
  },

  loading: { color: '#fff' },

  css: ['~/assets/css/main.css'],

  buildModules: [
    // Doc: https://github.com/nuxt-community/nuxt-tailwindcss
    '@nuxtjs/tailwindcss',
    '@nuxt/typescript-build',
  ],
}

export default config
