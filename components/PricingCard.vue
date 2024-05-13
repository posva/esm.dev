<script setup lang="ts">
import { useSpring } from 'vue-use-spring'
import { clamp } from '@vueuse/core'
// import { isTouchEvent } from '../utils/touch'
// import { round, adjust } from '../utils/math'

const { open: openCal } = useCalButton()

const props = withDefaults(
  defineProps<{
    tier: string
    price: number | string
    icon: string
    spots?: string | null

    // styling
    shine?: 'lines' | 'spot' | 'crosses' | 'rainbow'
    primary?: string
    secondary?: string
    width?: number | string
    height?: number | string
    rotateMultiplier?: number | { x: number; y: number }
    blend?:
      | 'normal'
      | 'multiply'
      | 'screen'
      | 'overlay'
      | 'darken'
      | 'lighten'
      | 'color-dodge'
      | 'color-burn'
      | 'hard-light'
      | 'soft-light'
      | 'difference'
      | 'exclusion'
      | 'hue'
      | 'saturation'
      | 'color'
      | 'luminosity'
  }>(),
  {
    rotateMultiplier: () => ({
      x: 0.1,
      y: 0.15,
    }),
    width: 660 / 2,
    height: 300 / 2,
    // overlay is nice for colored cards,
    // for black/white cards (like cards against humanity, hard-light works better)
    blend: 'soft-light',
    shine: 'lines',
  }
)

const gradientBg = computed(
  () =>
    props.primary &&
    props.secondary && {
      'background-image': `linear-gradient(to right top, ${props.primary}, ${props.secondary});`,
    }
)

const interacting = ref(false)

const springRotate = useSpring({ x: 0, y: 0 })
const springGlare = useSpring({ x: 50, y: 50, o: 0 })
const springBackground = useSpring({ x: 50, y: 50 })
const springRotateDelta = useSpring({ x: 0, y: 0 })
const springTranslate = useSpring({ x: 0, y: 0 })
const springScale = useSpring({ v: 1 })
const linesPos = useSpring({ v: -50 })

function toggle() {
  springRotateDelta.y = springRotateDelta.y > 90 ? 0 : 180
}

const card = ref<HTMLElement>()

function onMouseMove(e: MouseEvent | TouchEvent) {
  let clientX: number
  let clientY: number
  if (isTouchEvent(e)) {
    clientX = e.touches[0].clientX
    clientY = e.touches[0].clientY
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }

  const $el = card.value
  if (!$el) return

  linesPos.v = 150

  const rect = $el.getBoundingClientRect() // get element's current size/position
  const absolute = {
    x: clientX - rect.left, // get mouse position from left
    y: clientY - rect.top, // get mouse position from right
  }
  const percent = {
    x: clamp(round((100 / rect.width) * absolute.x), 0, 100),
    y: clamp(round((100 / rect.height) * absolute.y), 0, 100),
  }
  const center = {
    x: percent.x - 50,
    y: percent.y - 50,
  }

  // springScale.v = 1.05

  springBackground.x = adjust(percent.x, 0, 100, 37, 63)
  springBackground.y = adjust(percent.y, 0, 100, 33, 67)

  const rotateMultiplierX =
    typeof props.rotateMultiplier === 'number'
      ? props.rotateMultiplier
      : props.rotateMultiplier.x
  const rotateMultiplierY =
    typeof props.rotateMultiplier === 'number'
      ? props.rotateMultiplier
      : props.rotateMultiplier.y

  springRotate.x = round(rotateMultiplierX * -center.x)
  springRotate.y = round(rotateMultiplierY * center.y)

  springGlare.x = round(percent.x)
  springGlare.y = round(percent.y)
  springGlare.o = 0.6
}

function onMouseOut() {
  springRotate.x = 0
  springRotate.y = 0
  springGlare.o = 0
  springGlare.x = 50
  springGlare.y = 50
  springBackground.x = 50
  springBackground.y = 50
  springScale.v = 1
  linesPos.v = -50
}

// CSS variables inlined here because if I put the expressions directly in the style tag
// the page cannot be directly visited. SSR bug?
const cssPointerX = computed(() => `${springGlare.x}%`)
const cssPointerY = computed(() => `${springGlare.y}%`)
const cssRotateX = computed(() => `${springRotate.x + springRotateDelta.x}deg`)
const cssRotateY = computed(() => `${springRotate.y + springRotateDelta.y}deg`)
const cssBackgroundX = computed(() => `${springBackground.x}%`)
const cssBackgroundY = computed(() => `${springBackground.y}%`)
const cssTranslateX = computed(() => `${springTranslate.x}px`)
const cssTranslateY = computed(() => `${springTranslate.y}px`)
const cssHeight = computed(() => `${props.height}px`)
const cssLinesPos = computed(() => `${linesPos.v}%`)
</script>

<template>
  <div class="card not-prose" :class="{ interacting }">
    <div class="card_translater">
      <div
        class="card_rotator"
        ref="card"
        @mousemove="onMouseMove"
        @mouseout="onMouseOut"
        @focus="interacting = true"
        @blur="interacting = false"
      >
        <section
          class="flex flex-col px-4 pt-3 pb-3 border-4 select-none card_back"
        >
          <h4 class="mb-4 font-mono text-xl">Perks</h4>

          <div class="flex-grow pb-4 text-sm">
            <slot name="back">Back</slot>
          </div>

          <div class="flex justify-between w-full mx-auto">
            <button class="btn secondary" @click="toggle()">
              <span>
                <Icon name="material-symbols:arrow-back-ios-new" /> Back
              </span>
            </button>

            <button class="btn" @click="openCal('posva/sponsor')">
              <span> <Icon name="material-symbols:call" /> Let's talk </span>
            </button>
          </div>

          <div
            class="absolute right-0 pl-4 pr-1 overflow-hidden font-mono rounded-l-full top-4 bg-neutral-300/20"
          >
            <span>{{ price }}€</span><span class="text-xs">/mo</span>
            <div class="card_glare spot"></div>
          </div>

          <div class="card_glare spot"></div>
        </section>

        <section
          class="relative flex flex-col p-4 border-4 select-none card_front"
        >
          <h4 class="flex items-center font-mono text-2xl">
            <span
              class="relative block w-10 h-10 mr-2 overflow-hidden text-center border border-current rounded-full bg-slate-400/30"
            >
              <Icon :name="icon" class="" />
            </span>
            <span class="block">{{ tier }}</span>
          </h4>

          <div
            class="absolute right-0 pl-4 pr-1 overflow-hidden font-mono rounded-l-full top-4 bg-neutral-300/20"
          >
            <span>{{ price }}€</span><span class="text-xs">/mo</span>
            <div class="card_glare spot"></div>
          </div>

          <div class="flex-grow pb-4 mt-2 text-sm">
            <slot name="front">Front</slot>
          </div>
          <div class="card_glare" :class="shine"></div>

          <div class="flex items-end justify-between">
            <button
              class="btn"
              @click="springRotateDelta.y = springRotateDelta.y > 90 ? 0 : 180"
            >
              <span>
                Perks
                <Icon name="ion:sparkles-sharp" />
              </span>
              <div class="card_glare spot"></div>
            </button>
            <span v-if="spots !== null" class="font-mono text-xs">
              <span v-if="!spots"><Icon name="ion:infinite" /> spots</span>
              <span v-else>{{ spots }}</span>
            </span>
            <!-- <button class="btn secondary">
              Let's talk <Icon name="material-symbols:call" />
            </button> -->
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<style scoped>
button.card_rotator {
  border: none;
  background: transparent;
  padding: 0;

  appearance: none;
}

.card_glare {
  will-change: transform, opacity, background-image, background-size,
    background-position, background-blend-mode, filter;
}

.card_front,
.card_back {
  background-image: linear-gradient(
    to left bottom,
    var(--card-primary),
    var(--card-secondary)
  );
}

.card .btn {
  --primary: var(--card-primary);

  @apply relative px-4 mt-2 overflow-hidden font-mono text-sm font-bold transition-all border-2 rounded-full shadow-inner active:shadow-black shadow-slate-200;

  border-color: currentColor;
  border-color: color-mix(in srgb, var(--primary) 20%, currentColor 40%);
  background-color: var(--primary);
  background-color: color-mix(in srgb, var(--primary) 30%, transparent);
}

.card_back,
.card_front {
  --border-color: #000;
  border-color: color-mix(
    in srgb,
    var(--border-color) 60%,
    var(--card-primary) 60%
  );
}

@media (prefers-dark-interface), (prefers-color-scheme: dark) {
  .card_back,
  .card_front {
    --border-color: #fff;
  }
}

.card .btn:hover {
  background-color: color-mix(in srgb, var(--primary) 90%, transparent);
}

.card .btn:active {
  border-color: transparent;
}

.btn.secondary {
  --primary: var(--card-secondary);
}

.card,
.card_translater,
.card_back,
.card_front,
.card_rotator {
  width: 100%;
  height: 100%;
}

.card {
  /* place the card on a new transform layer and
  make sure it has hardware acceleration. Not needed in all browsers though */
  transform: translate3d(0px, 0px, 0.01px);

  transform-style: preserve-3d;
  /* pointer-events: none; */

  /* make sure the card is above others if it's scaled up */
  z-index: calc(var(--card-scale) * 2);

  /* every little helps! */
  will-change: transform, visibility, z-index;

  /* can't do 2 rows in CSS? */
  /* height: v-bind('cssHeight'); */
}

/* force it appearing above close cards when hovering */
.card.card:hover {
  z-index: calc(var(--card-scale) * 100);
}

.card,
.card * {
  /* outline is a little trick to anti-alias, it looks good on images but not on content */
  /* outline: 1px solid transparent; */
}

.card,
.card_rotator {
  /* aspect-ratio: var(--card-aspect); */
  border-radius: var(--card-radius, 10px);
}

.card.card.interacting {
  z-index: calc(var(--card-scale) * 120);
}

.card_translater,
.card_rotator {
  display: grid;
  perspective: 600px;
  will-change: transform, box-shadow;

  transform-origin: center;
}

.card_translater {
  position: relative;

  transform:
  /* FIXME: vue bug */
    /* translate3d(var(--translate-x), var(--translate-y), 0.1px) */ scale(
    var(--card-scale)
  );
}

.card_rotator {
  transform: rotateY(var(--rotate-x)) rotateX(var(--rotate-y));
  transform-style: preserve-3d;

  /* performance */
  pointer-events: auto;
}

/* remove button styles */
button.card_rotator {
  appearance: none;
  border: none;
  background: transparent;
  padding: 0;
}

.card_rotator {
  transition:
    box-shadow 0.4s ease,
    opacity 0.33s ease-out;
  box-shadow: 5px 6px 6px -1px rgba(0, 0, 0, 0.3);
}
.card:hover .card_rotator {
  box-shadow: 0px 30px 100px -10px rgba(0, 0, 0, 0.4);
}

.card .card_rotator:focus {
  /* box-shadow:
    0 0 3px -1px white,
    0 0 3px 1px var(--card-edge, hsl(326, 46%, 56%)),
    0 0 12px 2px var(--card-glow, rgba(249, 242, 156, 0.889)),
    0px 10px 20px -5px black,
    0 0 40px -30px var(--card-glow, rgba(249, 242, 156, 0.889)),
    0 0 50px -20px var(--card-glow, rgba(249, 242, 156, 0.889)); */
}

.card_rotator > * {
  /* width: 100%; */
  display: flex;
  grid-area: 1/1;
  text-align: initial;
  /* aspect-ratio: var(--card-aspect); */
  border-radius: var(--card-radius, 10px);

  transform-style: preserve-3d;
  /* pointer-events: none; */
  overflow: hidden;
}

.card_rotator img {
  image-rendering: crisp-edges;
}

.card_rotator .card_back,
.card_rotator .card_front {
  transform: translate3d(0px, 0px, 0.01px);
}

.card_back.card_back {
  /* background-color: var(--card-back); */
  transform: rotateX(180deg) translateZ(1px);
  backface-visibility: visible;
}

.card_front,
.card_front > * {
  backface-visibility: hidden;
}

.card_front {
  opacity: 1;
  transition: opacity 0.33s ease-out;

  transform: translate3d(0px, 0px, 0.01px);
}

.loading .card_front {
  opacity: 0;
}

.loading .card_back {
  transform: rotateY(0deg);
}

/**

Shine & Glare Effects

**/

.card_glare {
  /* make sure the glare doesn't clip */
  transform: translateZ(1.41px);
  overflow: hidden;
  position: absolute;
  pointer-events: none;
  top: -5px;
  left: -5px;
  bottom: 0;
  right: 0;
  width: auto;
  height: auto;

  opacity: var(--card-opacity);

  mix-blend-mode: v-bind('blend');
}

.card_glare.lines {
  --lines-pos: v-bind(cssLinesPos);
  mix-blend-mode: color-dodge;
  background-image: linear-gradient(
    128deg,
    rgba(0, 0, 0, 1) calc(var(--lines-pos) - 50%),
    rgba(255, 255, 255, 1) calc(var(--lines-pos) - 35%),
    rgba(0, 0, 0, 1) calc(var(--lines-pos) - 15%),
    rgba(0, 0, 0, 1) calc(var(--lines-pos) - 5%),
    rgba(255, 255, 255, 1) calc(var(--lines-pos) + 10%),
    rgba(0, 0, 0, 1) calc(var(--lines-pos) + 25%),
    rgba(0, 0, 0, 1) calc(var(--lines-pos) + 30%),
    rgba(255, 255, 255, 1) calc(var(--lines-pos) + 45%),
    rgba(0, 0, 0, 1) calc(var(--lines-pos) + 60%)
  );
}

.card_glare.spot {
  background-image: radial-gradient(
    farthest-corner circle at var(--pointer-x) var(--pointer-y),
    hsla(0, 0%, 100%, 0.8) 10%,
    hsla(0, 0%, 100%, 0.65) 20%,
    hsla(0, 0%, 0%, 0.5) 90%
  );
}

.card_glare.crosses {
  --barwidth: 1.7%;
  /* --space: 200px; */
  /* --hue: 50; */
  --imgsize: cover;
  background-image: radial-gradient(
      farthest-corner ellipse at calc(((var(--pointer-x)) * 0.5) + 25%)
        calc(((var(--pointer-y)) * 0.5) + 25%),
      hsl(283, 82%, 80%) 20%,
      var(--card-glow) 130%
    ),
    repeating-linear-gradient(
      45deg,
      hsl(0, 0%, 10%) 0%,
      hsl(0, 0%, 10%) 1%,
      hsl(0, 0%, 10%) var(--barwidth),
      hsl(0, 0%, 20%) calc(var(--barwidth) + 0.01%),
      hsl(0, 0%, 20%) calc(var(--barwidth) * 2),
      hsl(0, 0%, 35%) calc(var(--barwidth) * 2 + 0.01%),
      hsl(0, 0%, 35%) calc(var(--barwidth) * 3),
      hsl(0, 0%, 42.5%) calc(var(--barwidth) * 3 + 0.01%),
      hsl(0, 0%, 42.5%) calc(var(--barwidth) * 4),
      hsl(0, 0%, 50%) calc(var(--barwidth) * 4 + 0.01%),
      hsl(0, 0%, 50%) calc(var(--barwidth) * 5),
      hsl(0, 0%, 42.5%) calc(var(--barwidth) * 5 + 0.01%),
      hsl(0, 0%, 42.5%) calc(var(--barwidth) * 6),
      hsl(0, 0%, 35%) calc(var(--barwidth) * 6 + 0.01%),
      hsl(0, 0%, 35%) calc(var(--barwidth) * 7),
      hsl(0, 0%, 20%) calc(var(--barwidth) * 7 + 0.01%),
      hsl(0, 0%, 20%) calc(var(--barwidth) * 8),
      hsl(0, 0%, 10%) calc(var(--barwidth) * 8 + 0.01%),
      hsl(0, 0%, 10%) calc(var(--barwidth) * 9),
      hsl(0, 0%, 0%) calc(var(--barwidth) * 9 + 0.01%),
      hsl(0, 0%, 0%) calc(var(--barwidth) * 10)
    ),
    repeating-linear-gradient(
      -45deg,
      hsl(0, 0%, 10%) 0%,
      hsl(0, 0%, 10%) 1%,
      hsl(0, 0%, 10%) var(--barwidth),
      hsl(0, 0%, 20%) calc(var(--barwidth) + 0.01%),
      hsl(0, 0%, 20%) calc(var(--barwidth) * 2),
      hsl(0, 0%, 35%) calc(var(--barwidth) * 2 + 0.01%),
      hsl(0, 0%, 35%) calc(var(--barwidth) * 3),
      hsl(0, 0%, 42.5%) calc(var(--barwidth) * 3 + 0.01%),
      hsl(0, 0%, 42.5%) calc(var(--barwidth) * 4),
      hsl(0, 0%, 50%) calc(var(--barwidth) * 4 + 0.01%),
      hsl(0, 0%, 50%) calc(var(--barwidth) * 5),
      hsl(0, 0%, 42.5%) calc(var(--barwidth) * 5 + 0.01%),
      hsl(0, 0%, 42.5%) calc(var(--barwidth) * 6),
      hsl(0, 0%, 35%) calc(var(--barwidth) * 6 + 0.01%),
      hsl(0, 0%, 35%) calc(var(--barwidth) * 7),
      hsl(0, 0%, 20%) calc(var(--barwidth) * 7 + 0.01%),
      hsl(0, 0%, 20%) calc(var(--barwidth) * 8),
      hsl(0, 0%, 10%) calc(var(--barwidth) * 8 + 0.01%),
      hsl(0, 0%, 10%) calc(var(--barwidth) * 9),
      hsl(0, 0%, 0%) calc(var(--barwidth) * 9 + 0.01%),
      hsl(0, 0%, 0%) calc(var(--barwidth) * 10)
    );
  background-size:
    cover,
    210% 210%,
    210% 210%;
  background-position:
    center,
    calc(((var(--background-x) - 50%) * 1.5) + 50%)
      calc(((var(--background-y) - 50%) * 1.5) + 50%),
    calc(((var(--background-x) - 50%) * 1.5) + 50%)
      calc(((var(--background-y) - 50%) * 1.5) + 50%);
  background-blend-mode: exclusion, color-dodge, color-burn;
  filter: brightness(0.5) contrast(2) saturate(1.75);
  mix-blend-mode: soft-light;
}

.card_glare.rainbow {
  --space: 5%;
  --angle: 133deg;
  --imgsize: 500px;
  --grain: url(/img/grain.webp);
  --sunpillar-1: hsl(2, 100%, 73%);
  --sunpillar-2: hsl(53, 100%, 69%);
  --sunpillar-3: hsl(93, 100%, 69%);
  --sunpillar-4: hsl(176, 100%, 76%);
  --sunpillar-5: hsl(228, 100%, 74%);
  --sunpillar-6: hsl(283, 100%, 73%);
  --sunpillar-clr-1: var(--sunpillar-1);
  --sunpillar-clr-2: var(--sunpillar-2);
  --sunpillar-clr-3: var(--sunpillar-3);
  --sunpillar-clr-4: var(--sunpillar-4);
  --sunpillar-clr-5: var(--sunpillar-5);
  --sunpillar-clr-6: var(--sunpillar-6);

  background-image: var(--grain),
    repeating-linear-gradient(
      0deg,
      var(--sunpillar-clr-1) calc(var(--space) * 1),
      var(--sunpillar-clr-2) calc(var(--space) * 2),
      var(--sunpillar-clr-3) calc(var(--space) * 3),
      var(--sunpillar-clr-4) calc(var(--space) * 4),
      var(--sunpillar-clr-5) calc(var(--space) * 5),
      var(--sunpillar-clr-6) calc(var(--space) * 6),
      var(--sunpillar-clr-1) calc(var(--space) * 7)
    ),
    repeating-linear-gradient(
      var(--angle),
      #0e152e 0%,
      hsl(180, 10%, 60%) 3.8%,
      hsl(180, 29%, 66%) 4.5%,
      hsl(180, 10%, 60%) 5.2%,
      #0e152e 10%,
      #0e152e 12%
    ),
    radial-gradient(
      farthest-corner circle at var(--pointer-x) var(--pointer-y),
      hsla(0, 0%, 0%, 0.1) 12%,
      hsla(0, 0%, 0%, 0.15) 20%,
      hsla(0, 0%, 0%, 0.25) 120%
    );
  background-blend-mode: screen, hue, hard-light;
  background-size:
    var(--imgsize) 100%,
    200% 700%,
    300% 100%,
    200% 100%;
  background-position:
    center,
    0% var(--background-y),
    var(--background-x) var(--background-y),
    var(--background-x) var(--background-y);
  filter: brightness(0.8) contrast(2.95) saturate(0.65);
}

.card {
  /* --card-aspect: 0.718; */
  /* --card-radius: 5px; */
  --card-edge: hsl(0, 100%, 41%);
  /* --card-back: hsl(205, 100%, 25%); */
  --card-glow: hsl(0, 0%, 100%);

  --card-primary: v-bind(primary);
  --card-secondary: v-bind(secondary);

  --card-scale: v-bind('springScale.v');
  --card-opacity: v-bind('springGlare.o');
  --pointer-x: v-bind(cssPointerX);
  --pointer-y: v-bind(cssPointerY);
  --rotate-x: v-bind(cssRotateX);
  --rotate-y: v-bind(cssRotateY);
  --background-x: v-bind(cssBackgroundX);
  --background-y: v-bind(cssBackgroundY);
  --translate-x: v-bind(cssTranslateX);
  --translate-y: v-bind(cssTranslateY);
}
</style>
