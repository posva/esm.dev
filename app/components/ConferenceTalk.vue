<script lang="ts" setup>
import type { ConferenceTalk } from '~/talks/data'

const props = defineProps<{
  talk: ConferenceTalk
}>()

/**
 * Notes:
 * - darker color if no video
 * - detail page to improve engagement
 */

const langFlag = computed<string>(() => {
  if (props.talk.language === 'es') return 'flag:es-4x3'
  if (props.talk.language === 'fr') return 'flag:fr-4x3'

  return 'flag:gb-4x3'
})
</script>

<template>
  <article>
    <h3>{{ talk.title }}</h3>
    <!-- TODO: do not display by default, collapse -->
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
    <Icon :name="langFlag" />
    <span class="sr-only"> {{ talk.language || 'en' }}</span>
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
