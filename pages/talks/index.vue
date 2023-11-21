<script lang="ts" setup>
import { talks } from '~/talks/data'

useHead({
  title: 'Talks',
})
</script>

<template>
  <main
    class="w-full max-w-xl pt-16 mx-auto prose lg:prose-xl dark:prose-invert prose-stone"
  >
    <ConferenceTalk v-for="talk in talks" :talk="talk" />
  </main>

  <DiscussionComments />
</template>
