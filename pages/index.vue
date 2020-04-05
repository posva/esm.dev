<template>
  <div class="leading-tight max-w-full relative" id="bio-container">
    <div id="content-backdrop" class="md:px-4 py-1 rounded shadow-lg">
      <h1 class="text-4xl font-bold my-3">Hi 👋</h1>
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
  </div>
</template>

<script lang="ts">
import { rotateOffsets } from '~/lab/dom/links'
import LabExperiment from '~/components/LabExperiment.vue'

export default {
  components: { LabExperiment },

  mounted() {
    let rafId: number
    function update() {
      rafId = requestAnimationFrame((elapsed) => {
        stepper(elapsed)
        update()
      })
    }

    // For better dev
    // @ts-ignore
    if (module.hot) {
      // @ts-ignore
      module.hot.accept('~/lab/dom/links', () => {
        cancelAnimationFrame(rafId)
        update()
      })
    }

    document.querySelectorAll('a').forEach((link) => {
      link.dataset['text'] = link.innerText
    })

    update()

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
      if (process.env.NODE_ENV === 'production')
        rotateOffsets(ratio, Math.max(1, Math.min(mouseTravel / 200, 10)))
    }

    const lastMousePos = [-1, -1]
    let mouseTravel = 0
    let lastMove = 0
    const mouseMoveListener = ({ pageX, pageY }: MouseEvent) => {
      if (lastMousePos[0] > -1)
        mouseTravel += Math.max(
          Math.abs(pageX - lastMousePos[0]),
          Math.abs(pageY - lastMousePos[1])
        )
      lastMousePos[0] = pageX
      lastMousePos[1] = pageY
      lastMove = Date.now()
    }
    document.body.addEventListener('mousemove', mouseMoveListener)
    ;(this as any).mouseMoveListener = mouseMoveListener
  },

  destroyed() {
    document.body.removeEventListener(
      'mousemove',
      (this as any).mouseMoveListener
    )
  },
}
</script>

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
</style>
