<script lang="ts" setup>
import { vMagnetic } from '@/directives/vMagnetic'

definePageMeta({
  layout: 'default',
})

const route = useRoute()
const { data: page } = await useAsyncData(route.path, () => {
  return queryCollection('content').path(route.path).first()
})

useHead({
  title: () => page.value?.title ?? 'Not found',
})
</script>

<template>
  <main
    class="w-full max-w-xl px-4 pt-16 mx-auto prose sm:px-0 lg:prose-xl dark:prose-invert prose-stone"
  >
    <ContentRenderer v-if="page" :value="page" />
    <div v-else class="empty-page">
      <h1>Not found</h1>
      <p>
        Sorry, we couldn't find that page.
        <NuxtLink to="/" v-magnetic>Go Back Home</NuxtLink>.
      </p>
    </div>
  </main>
</template>
