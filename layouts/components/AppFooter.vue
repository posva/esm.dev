<script lang="ts" setup>
const footerSocials = [
  {
    icon: 'line-md:twitter-x',
    text: 'X',
    url: 'https://twitter.com/posva',
  },
  {
    icon: 'line-md:github-loop',
    text: 'Github',
    url: 'https://github.com/posva',
  },
  {
    text: 'Twitch',
    icon: 'ph:twitch-logo-duotone',
    url: 'https://twitch.tv/posva13',
  },
] satisfies Array<{
  icon: string
  text: string
  url: string
}>
</script>

<template>
  <footer>
    <div class="flex flex-col items-center py-4 space-y-2 text-gray-500">
      <div class="flex space-x-2">
        <a
          :href="social.url"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center space-x-1 text-xl transition-opacity opacity-50 hover:opacity-100"
          v-for="social of footerSocials"
        >
          <Icon :name="social.icon" />
          <span class="sr-only">{{ social.text }}</span>
        </a>
      </div>
    </div>
  </footer>
</template>
