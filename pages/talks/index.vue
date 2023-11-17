<script lang="ts" setup>
import { talks } from '~/talks/data'
</script>

<template>
  <main class="prose lg:prose-xl dark:prose-invert">
    <ConferenceTalk v-for="talk in talks" :talk="talk" />
  </main>

  <DiscussionComments />
</template>
