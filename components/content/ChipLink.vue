<script lang="ts" setup>
defineProps<{
  img?: string | [light: string, dark: string]
  icon?: string
  text: string
  url?: string
}>()
</script>

<template>
  <NuxtLink
    :to="url"
    class="inline-flex items-baseline px-2 leading-normal tracking-tighter no-underline transition-shadow duration-300 bg-opacity-50 border rounded-full shadow-inner hover:shadow-neutral-50 dark:shadow-neutral-950 dark:hover:shadow-neutral-600 bg-neutral-100 dark:bg-neutral-800/50 dark:border-neutral-800 ring-inset active:shadow-neutral-300 dark:active:shadow-black dark:active:border-transparent"
  >
    <picture
      v-if="img"
      class="w-4 h-4 translate-y-0.5"
      style="margin: 0 0.25em 0 0"
    >
      <template v-if="Array.isArray(img)">
        <source
          :srcset="img[1]"
          media="(prefers-color-scheme: dark), (prefers-color-scheme: no-preference)"
        />
        <source :srcset="img[0]" media="(prefers-color-scheme: light)" />
        <img class="w-4 h-4" :src="img[1]" />
      </template>
      <img class="w-4 h-4 my-0" v-else :src="img" />
    </picture>
    <Icon
      v-else-if="icon"
      :name="icon"
      class="translate-y-1 mr-0.5"
      style="font-size: 1.2em"
    />
    <span class="">{{ text }}</span>
  </NuxtLink>
</template>
