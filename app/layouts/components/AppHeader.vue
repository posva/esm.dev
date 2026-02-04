<script lang="ts" setup>
const navLinks = [
  {
    text: 'OSS',
    icon: 'icon-park-twotone:planet',
    url: '/open-source',
  },
  // {
  //   icon: 'icon-park-twotone:notebook',
  //   text: 'Blog',
  //   url: '/blog',
  // },
  // {
  //   icon: 'icon-park-twotone:collect-laptop',
  //   text: 'Uses',
  //   url: '/uses',
  // },
  // {
  //   icon: 'icon-park-twotone:microphone-one',
  //   text: 'Talks',
  //   url: '/talks',
  // },
  {
    text: 'Labs',
    icon: 'icon-park-twotone:experiment',
    url: '/labs',
  },
] satisfies Array<{
  icon: string
  text: string
  url: string
}>
</script>

<template>
  <header class="flex px-4 py-2 transition-opacity opacity-50 hover:opacity-100">
    <NuxtLink to="/" title="Homepage">
      <img class="w-8 rounded-full" src="/avatar.jpg" alt="Eduardo" />
      <span class="sr-only">Homepage</span>
    </NuxtLink>

    <div class="flex-grow"></div>

    <div class="flex space-x-2">
      <NuxtLink
        v-for="link of navLinks"
        :to="link.url"
        class="flex items-center space-x-1"
        :title="link.text"
        exact-active-class="underline underline-offset-4"
      >
        <Icon :name="link.icon" />
        <span class="hidden sm:block">{{ link.text }}</span>
      </NuxtLink>
    </div>
  </header>
</template>
