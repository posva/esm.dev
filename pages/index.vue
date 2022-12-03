<script setup lang="ts">
import { rotateOffsets } from '~/lab/dom/links'

let lastElapsed = 0
const BASE_DELTA = 1000 / 60 // 1s / 60 frames
let lastDelta = BASE_DELTA

function stepper(elapsed: number) {
  lastDelta = elapsed - lastElapsed
  lastElapsed = elapsed
  const ratio = lastDelta / BASE_DELTA

  if (Date.now() - lastMove > 200) {
    mouseTravel = Math.max(0, mouseTravel - ratio * 70)
  }

  // only on production because we add css variables on root and it's hard to debug
  if (process.env.NODE_ENV === 'production') {
    rotateOffsets(ratio, Math.max(1, Math.min(mouseTravel / 200, 10)))
  }
}

const lastMousePos = [-1, -1]
let mouseTravel = 0
let lastMove = 0
function mouseMoveListener({ pageX, pageY }: MouseEvent) {
  if (lastMousePos[0] > -1)
    mouseTravel += Math.max(
      Math.abs(pageX - lastMousePos[0]),
      Math.abs(pageY - lastMousePos[1])
    )
  lastMousePos[0] = pageX
  lastMousePos[1] = pageY
  lastMove = Date.now()
}

let rafId: number
function update() {
  rafId = requestAnimationFrame((elapsed) => {
    stepper(elapsed)
    update()
  })
}

onMounted(() => {
  // For better dev
  if (import.meta.hot) {
    import.meta.hot.accept('~/lab/dom/links', () => {
      cancelAnimationFrame(rafId)
      update()
    })
  }

  document.querySelectorAll('a').forEach((link) => {
    link.dataset['text'] = link.innerText
  })

  update()

  document.body.addEventListener('mousemove', mouseMoveListener)
})

onUnmounted(() => {
  document.body.removeEventListener('mousemove', mouseMoveListener)
})
</script>

<template>
  <div class="relative max-w-full leading-tight" id="bio-container">
    <div id="content-backdrop" class="px-1 py-1 rounded shadow-lg md:px-4">
      <h1 class="my-3 text-4xl font-bold">Hi 👋</h1>
      <p class="my-4">
        <!-- <img src="assets/casual-me.jpg" alt="picture of myself" /> -->
        I'm Eduardo,
      </p>

      <main id="main">
        <p class="my-4">
          a Frontend Nerd. I work as a consultant to help you keep your
          applications maintainable. I also give
          <a href="#TODO">Vue.js trainings</a> and
          <a
            href="https://www.youtube.com/results?search_query=eduardo+san+martin+morote"
            >talk at conferences</a
          >. I write some
          <a href="https://github.com/posva">useful libraries</a>, mostly for
          Vue, but not only, and post them on Github. I may not
          <i>
            <a href="https://twitter.com/posva/status/1146415898967908352"
              >take myself very seriously</a
            >
          </i>
          but take my job very seriously and loves solving problems instead of
          complaining about them.
        </p>
        <p class="my-4">
          If you want to work together, please
          <a href="https://twitter.com/posva">send me a PM on Twitter</a>.
        </p>
      </main>
    </div>

    <LabExperiment :labId="$route.query.i" />
    <div id="lab-cloak"></div>
  </div>
</template>

<style>
#bio-container {
  padding: 5vh 5vw;
  width: 34rem;
}

@media (min-width: 768px) {
  #bio-container {
    padding-left: 10vw;
    padding-right: 10vw;
  }
}

#content-backdrop {
  background-color: rgba(var(--bgColor), 0.75);
}

#lab-cloak {
  background-color: rgb(var(--bgColor));
  width: 100vw;
  height: 100vh;
  position: fixed;
  z-index: -5;
  top: 0;
  left: 0;
  display: block;
  animation: fadeOut 1s ease-out 2s;
  animation-fill-mode: forwards;
}
</style>
