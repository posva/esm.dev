<script lang="ts" setup>
import { talks } from '~/talks/data'
</script>

<template>
  <main>
    <ConferenceTalk v-for="talk in talks" :talk="talk" />
  </main>

  <DiscussionComments />
</template>
