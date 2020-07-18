<template>
  <div>
    <template v-if="state < 2">
      <button @click="startAudio" :disabled="state > 0">Start Audio</button>
    </template>
    <Walen v-else-if="state === 2" :text="transformed" />

    <br />
    <textarea cols="30" rows="4" v-model="text"></textarea>
    <p>{{ transformed.join(' ') }}</p>
  </div>
</template>

<script lang="ts">
import Walen from '~/components/Walen.vue'
import { start } from 'tone'
import {
  defineComponent,
  toRefs,
  reactive,
  computed,
} from '@vue/composition-api'

const enum WalenParsingState {
  start,
  buffering,
}

export default defineComponent({
  setup() {
    const data = reactive({
      // 0 not loaded, 1, loading, 2 loaded
      state: 0,
      text: 'Hola, como estas',
    })

    async function startAudio() {
      data.state = 1
      await start()
      data.state = 2
    }

    function transformText(text: string) {
      // remove diacritics
      let cleaned = text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')

      let VOWEL_RE = /[aeiou]/
      let CONSONANT_RE = /[bcdfghjklmnpqrstxwyz]/
      let VALID_START_RE = /[a-z]/
      let SPACE_RE = /\s/
      let PUNCTUATION_RE = /[\.\?\!]/

      let i = 0
      let buffer = ''
      // number for pause
      let silabs: Array<string | number> = []

      let state: WalenParsingState = WalenParsingState.start

      function consumeBuffer() {
        if (buffer.length === 1 && CONSONANT_RE.test(buffer)) {
          // apend a u to the existing consonant
          buffer = buffer + 'u'
          buffer = ''
          return
        }
        silabs.push(
          buffer
            .replace(/^y$/, 'i')
            .replace('z', 's')
            .replace('v', 'b')
            .replace(/c([aou])/, 'k$1')
            .replace('c', 's')
            .replace(/g([ei])/, 'j$1')
            .replace('h', '')
        )

        buffer = ''
      }

      while (i < cleaned.length) {
        let char = cleaned[i]

        if (state === WalenParsingState.start) {
          buffer = char
          // ignore anything that isn't valid as a start
          if (VALID_START_RE.test(char)) {
            // consume vowels right away
            if (VOWEL_RE.test(char)) consumeBuffer()
            else state = WalenParsingState.buffering
          } else if (SPACE_RE.test(char)) {
            silabs.push(1)
            buffer = ''
          } else if (char === ',') {
            silabs.push(2)
            buffer = ''
          } else if (PUNCTUATION_RE.test(char)) {
            silabs.push(3)
            buffer = ''
          }
        } else if (state === WalenParsingState.buffering) {
          if (VOWEL_RE.test(char)) {
            if (VOWEL_RE.test(buffer)) {
              // keep the voyel in a different word
              consumeBuffer()
              state = WalenParsingState.start
              i--
            } else {
              if (buffer === 'q' && char === 'u') {
                buffer = 'k'
              } else {
                buffer = buffer + char
                consumeBuffer()
                state = WalenParsingState.start
              }
            }
            // it's a regular consonant
          } else if (char === buffer) {
            if (char === 'l') buffer = 'y'
            // ignore same character
          } else if (CONSONANT_RE.test(char)) {
            // consume current buffer with consonant
            consumeBuffer()
            buffer = char
          } else if (SPACE_RE.test(char)) {
            consumeBuffer()
            silabs.push(1)
            state = WalenParsingState.start
          } else if (char === ',') {
            silabs.push(2)
            state = WalenParsingState.start
          } else if (PUNCTUATION_RE.test(char)) {
            silabs.push(3)
            state = WalenParsingState.start
          }
        }

        i++
      }

      // discard ending consonants
      if (buffer) {
        // consumeBuffer()
      }

      return silabs
    }

    const transformed = computed(() => transformText(data.text))

    return { ...toRefs(data), startAudio, transformed }
  },
  components: { Walen },
})
</script>

<style lang="scss" scoped></style>
