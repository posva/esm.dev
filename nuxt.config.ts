import { Configuration } from '@nuxt/types'

const description = process.env.npm_package_description as string
const title = 'Eduardo San Martin Morote'

const config: Configuration = {
  mode: 'universal',

  head: {
    title,

    htmlAttrs: {
      lang: 'en',
    },

    meta: [
      { charset: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      {
        hid: 'description',
        name: 'description',
        content: description,
      },
      // <meta name="theme-color" content="black" />
      // <meta name="msapplication-navbutton-color" content="black" />
      { name: 'apple-mobile-web-app-capable', content: 'yes' },
      // <meta name="apple-mobile-web-app-status-bar-style" content="black" />

      // Open Graph data
      { property: 'og:title', content: title },
      { property: 'og:type', content: 'website' },
      { property: 'og:url', content: 'https://esm.dev' },
      { property: 'og:image', content: 'https://esm.dev/media-preview.jpg' },
      { property: 'og:description', content: description },
      // Twitter Card data
      { name: 'twitter:card', content: 'summary' },
      { name: 'twitter:site', content: '@posva' },
      { name: 'twitter:creator', content: '@posva' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: 'https://esm.dev/media-preview.jpg' },
    ],
    link: [
      { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
      { rel: 'icon', type: 'image/png', href: '/favicon.png' },
      { rel: 'manifest', href: '/manifest.json' },
    ],
  },

  loading: { color: '#fff' },

  css: ['~/assets/css/main.css'],

  buildModules: [
    // Doc: https://github.com/nuxt-community/nuxt-tailwindcss
    '@nuxtjs/tailwindcss',
    '@nuxt/typescript-build',
  ],

  modern: true,

  modules: ['@nuxt/press'],
}

export default config
