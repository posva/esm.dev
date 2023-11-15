<script lang="ts" setup>
import type { ConferenceTalk } from '~/talks/data'

defineProps<{
  talk: ConferenceTalk
}>()

/**
 * Notes:
 * - darker color if no video
 * - detail page to improve engagement
 */
</script>

<template>
  <article>
    <h3>{{ talk.title }}</h3>
    <!-- TODO: do not display the whole, collapse -->
    <p>{{ talk.description }}</p>
    <time :datetime="talk.date">{{ talk.date }}</time>
    <span>{{ talk.conference }}</span>
    <span v-if="talk.location">
      <Icon name="icon-park-twotone:local-pin" />
      {{ talk.location }}</span
    >
    <time v-if="talk.duration" :datetime="`PT0H${talk.duration}M00S`"
      >{{ talk.duration }}m</time
    >
    <span>{{ talk.language || 'en' }}</span>
    <div>
      <a v-if="talk.videoURL" :href="talk.videoURL">
        <Icon name="icon-park-twotone:play" />
        Watch</a
      >
    </div>
    <div>
      <a v-if="talk.slidesURL" :href="talk.slidesURL">Slides</a>
    </div>
    <div v-if="talk.tags.length">
      <span v-for="tag in talk.tags">{{ talk.tags }}</span>
    </div>
  </article>
</template>
