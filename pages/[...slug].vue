<script lang="ts" setup>
import { vMagnetic } from '@/directives/vMagnetic'
useHead({
  title: 'Not Found',
})
definePageMeta({
  layout: 'default',
})
</script>

<template>
  <main
    class="w-full max-w-xl px-4 pt-16 mx-auto prose sm:px-0 lg:prose-xl dark:prose-invert prose-stone"
  >
    <ContentDoc>
      <template #not-found>
        <h1>Not found</h1>
        <p>
          Sorry, we couldn't find that page.
          <RouterLink to="/" v-magnetic>Go Back Home</RouterLink>.
        </p>
      </template>
    </ContentDoc>
  </main>
</template>
