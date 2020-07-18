<template>
  <div>
    <p v-if="!effects.length">Loading sounds</p>
    <template v-else>
      <button @click="play">{{ isPlaying ? 'Stop' : 'Play' }}</button>
      <div>
        <div>
          <label>
            reverse sounds
            <input v-model="reverse" type="checkbox" @change="play" />
          </label>
        </div>
        <div>
          <label>
            speed
            <input
              v-model.number="sequenceSpeed"
              type="range"
              @change="play"
              :min="0.1"
              :max="5"
              :step="0.1"
            />
            ({{ sequenceSpeed }})
          </label>
        </div>
        <section v-for="(effect, i) in effects" :key="i">
          <h2>{{ effect.name }}</h2>
          <div v-for="(param, j) in effect.params" :key="j">
            <template v-if="param.type === 'number'">
              <label>
                {{ param.name }}
                <input
                  v-model.number="param.value"
                  type="range"
                  @change="play"
                  :min="param.min"
                  :max="param.max"
                  :step="param.step"
                />
                ({{ param.value }})
              </label>
            </template>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<script lang="ts">
import { loadSound, EffectUi, createSequence } from '~/lab/sounds/speech'
import { Sequence, Player, Transport } from 'tone'
import {
  defineComponent,
  reactive,
  toRefs,
  onBeforeUnmount,
  PropType,
} from '@vue/composition-api'

export default defineComponent({
  props: {
    text: {
      type: Array as PropType<Array<number | string>>,
      required: true,
    },
  },
  setup(props) {
    const state = reactive({
      isPlaying: false,
      sequenceSpeed: 1,
      reverse: false,
      effects: [] as Pick<EffectUi, 'name' | 'params'>[],
    })

    const context = loadSound()
    let sentence: Sequence | null = null
    let players: Record<string, Player> = {}

    context.then(({ effects, players: allPlayers }) => {
      players = allPlayers
      state.effects = effects.map(({ name, params }) =>
        reactive({
          name,
          params,
        })
      )
      Transport.start()
    })

    onBeforeUnmount(() => {
      for (let note in players) {
        players[note].dispose()
      }
      if (sentence) sentence.dispose()
    })

    function play() {
      if (sentence) {
        sentence.stop()
        sentence.dispose()
      }
      sentence = createSequence(props.text, players, { reverse: state.reverse })
      // @ts-ignore
      window.seq = sentence
      sentence.loop = false
      sentence.playbackRate = state.sequenceSpeed
      sentence.start()
      // if (state.isPlaying) {
      //   context.sentence.stop()
      // } else {
      //   context.sentence.start()
      // }
      // state.isPlaying = !state.isPlaying
    }

    return { ...toRefs(state), play }
  },
})
</script>

<style lang="scss" scoped></style>
