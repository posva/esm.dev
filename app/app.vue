<script lang="ts" setup>
useHead({
  templateParams: { separator: '|' },
  titleTemplate: '%s %separator Eduardo San Martin Morote',

  htmlAttrs: {
    lang: 'en',
  },

  link: [{ rel: 'icon', type: 'image/png', href: '/favicon.png' }],

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
})
</script>

<template>
  <div>
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
