import {
  Player,
  Players,
  Transport,
  Sequence,
  PingPongDelay,
  Tremolo,
  PitchShift,
  ToneAudioNode,
  FeedbackDelay,
  AutoWah,
  BitCrusher,
  Chebyshev,
  Distortion,
  Phaser,
  Vibrato,
  Chorus,
} from 'tone'
import { computed, reactive, watchEffect } from '@vue/composition-api'

interface EffectValueNumber {
  type: 'number'
  name: string
  min: number
  max: number
  step: number
}

interface EffectValueNumberModifiable extends EffectValueNumber {
  value: any
}

type EffectValue = EffectValueNumberModifiable
type EffectValueOption = EffectValueNumber

export interface EffectUi {
  _effect: ToneAudioNode
  name: string
  params: EffectValue[]
}

function createEffect(
  effect: ToneAudioNode,
  valueOptions: EffectValueOption[]
): EffectUi {
  const params: EffectValue[] = []
  const keys = valueOptions.map((option) => option.name)

  const initialState = effect.get()
  const state = reactive(
    keys.reduce((obj, key) => {
      obj[key] = initialState[key as keyof typeof initialState]
      return obj
    }, {} as Record<string, any>)
  )

  watchEffect(
    () => {
      effect.set(state)
    },
    { deep: true }
  )

  for (let option of valueOptions) {
    const param = {
      ...option,
      value: null,
    }
    // have to hack this because automatic unwrapping in vue composition api
    Object.defineProperty(param, 'value', {
      get: () => state[option.name],
      set: (value) => {
        state[option.name] = value
      },
    })
    params.push(param)
  }

  return { _effect: effect, name: effect.name, params }
}

const vowels = ['a', 'e', 'i', 'o', 'u']

let consonants = [
  'b',
  'c',
  'd',
  'f',
  'g',
  'h',
  'j',
  'k',
  'l',
  'm',
  'n',
  'p',
  'q',
  'r',
  's',
  't',
  'x',
  'w',
  'y',
  'z',
]

let sounds = [...vowels]
for (let c of consonants) {
  for (let v of vowels) sounds.push(c + v)
}

export async function loadSound() {
  let effects: EffectUi[] = []

  effects.push(
    createEffect(new Tremolo(9, 0.75).toDestination(), [
      { type: 'number', name: 'frequency', min: 0, max: 20, step: 1 },
    ])
  )

  // effects.push(
  //   createEffect(new PitchShift({ pitch: 7 }), [
  //     { type: 'number', name: 'pitch', min: -12, max: 12, step: 1 },
  //     { type: 'number', name: 'windowSize', min: 0.03, max: 0.1, step: 0.005 },
  //     { type: 'number', name: 'delayTime', min: 0, max: 1, step: 0.01 },
  //   ])
  // )

  // effects.push(new FeedbackDelay(0.1))

  // effects.push(
  //   createEffect(new AutoWah(180, 5), [
  //     { type: 'number', name: 'baseFrequency', min: 5, max: 200, step: 5 },
  //     { type: 'number', name: 'octaves', min: 1, max: 12, step: 1 },
  //     // { type: 'number', name: 'gain', min: 0, max: 5, step: 0.1 },
  //   ])
  // )

  effects.push(
    createEffect(
      new Chorus({
        spread: 0,
      }),
      [
        { type: 'number', name: 'frequency', min: 0, max: 10, step: 0.1 },
        { type: 'number', name: 'delayTime', min: 0, max: 10, step: 0.1 },
        { type: 'number', name: 'depth', min: 0, max: 1, step: 0.1 },
        { type: 'number', name: 'spread', min: 0, max: 180, step: 10 },
      ]
    )
  )

  // effects.push(
  //   createEffect(
  //     new Vibrato({
  //       depth: 0.7,
  //     }),
  //     [
  //       { type: 'number', name: 'maxDelay', min: 0, max: 0.01, step: 0.001 },
  //       { type: 'number', name: 'frequency', min: 0, max: 1000, step: 10 },
  //       { type: 'number', name: 'depth', min: 0, max: 1, step: 0.1 },
  //     ]
  //   )
  // )

  // effects.push(
  //   createEffect(
  //     new Phaser({
  //       baseFrequency: 350,
  //     }),
  //     [
  //       { type: 'number', name: 'baseFrequency', min: 5, max: 2000, step: 5 },
  //       { type: 'number', name: 'octaves', min: 1, max: 8, step: 0.5 },
  //     ]
  //   )
  // )

  // effects.push(new Chebyshev(100))
  // effects.push(new Distortion())

  // effects.push(
  //   createEffect(new BitCrusher(4), [
  //     { type: 'number', name: 'bits', min: 1, max: 16, step: 1 },
  //   ])
  // )

  effects[0]._effect.toDestination()
  effects.forEach((effect, i) => {
    if (i < 1) return
    effect._effect.connect(effects[i - 1]._effect)
  })

  let players = {} as Record<string, Player>
  const promises: Promise<any>[] = []

  let soundFiles: string[] = (require as any)
    .context('~/static/audio/walen', false, /\.mp3$/)
    .keys()
    .map((file: string) => file.replace(/\.\/(\w+)\.\w+$/, '$1'))

  let resolved = 0
  soundFiles.forEach((sound) => {
    let resolve: (value?: unknown) => void
    promises.push(new Promise((r) => (resolve = r)))
    players[sound] = new Player(`/audio/walen/${sound}.[mp3|ogg]`, () => {
      resolved++
      console.log(
        `loaded ${sound} (${Math.round((100 * resolved) / sounds.length)}%`
      )
      resolve()
    }).connect(effects[effects.length - 1]._effect)
    // }).toDestination()
    players[sound].set({
      fadeOut: '64n',
      fadeIn: '64n',
      reverse: false,
      playbackRate: 1,
    })
  })

  // let players = new Players(playerSounds, {
  //   fadeOut: '64n',
  //   fadeIn: '64n',
  //   baseUrl: '/sounds/',
  //   onload() {
  //     console.log('loaded')
  //   },
  // }).connect(effects[effects.length - 1]._effect)

  // sounds.forEach((sound) => {
  //   const player = players.player(sound)
  //   player.reverse = true
  //   player.playbackRate = 2.5
  // })

  // @ts-ignore
  window.p = players
  // @ts-ignore
  window.Transport = Transport

  await Promise.all(promises)

  // player.autostart = true
  return { players, effects }
}

export function createSequence(
  silabs: Array<number | string>,
  players: Record<string, Player>,
  { reverse }: { reverse: boolean }
): Sequence {
  const notes = silabs.reduce((silabs, silab) => {
    if (typeof silab === 'number')
      silabs.push(
        ...Array.from<string>({ length: silab }).fill('')
      )
    else {
      silabs.push(silab)
      // vowels take half the time in the sequence, so add an empty sequence to consonants
      if (!/^[aeiou]$/.test(silab)) silabs.push('')
    }
    return silabs
  }, [] as string[])
  console.log(notes)
  let sequence = new Sequence(
    (time, note) => {
      if (!note) return
      let player = players[note]
      console.log(`${time}: ${note} / ${player.sampleTime}`)
      player.reverse = reverse
      player.playbackRate = sequence.playbackRate
      player.start()
    },
    notes,
    '36n'
  )

  return sequence
}
