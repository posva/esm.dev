<script setup lang="ts">
import { vMagnetic } from '@/directives/vMagnetic'

definePageMeta({
  layout: 'barebones',
})
</script>

<template>
  <div class="relative max-w-full leading-tight" id="bio-container">
    <div
      class="py-4 bg-opacity-75 shadow-lg rounded-xl md:px-6 dark:bg-gray-950 bg-slate-100 dark:bg-opacity-80"
    >
      <h1 class="my-3 font-bold">
        Hi <span class="wave">👋</span>
      </h1>
      <p class="my-6">
        <!-- <img src="assets/casual-me.jpg" alt="picture of myself" /> -->
        I'm Eduardo,
      </p>

      <main id="main">
        <p class="my-6">
          a Frontend Nerd. I work as a consultant to help you keep your
          applications maintainable. I also give
          <a v-magnetic href="#TODO">Vue.js trainings</a> and
          <a
            href="https://www.youtube.com/results?search_query=eduardo+san+martin+morote"
            v-magnetic
            >talk at conferences</a
          >. I write some
          <a v-magnetic href="https://github.com/posva">useful libraries</a>,
          mostly for Vue, but not only, and post them on Github. I may not
          <i>
            <a
              v-magnetic
              href="https://twitter.com/posva/status/1146415898967908352"
              >take myself very seriously</a
            >
          </i>
          but take my job very seriously and loves solving problems instead of
          complaining about them.
        </p>
        <p class="my-6">
          If you want to work together, please
          <a v-magnetic href="https://twitter.com/posva"
            >send me a PM on Twitter</a
          >.
        </p>
      </main>
    </div>

    <LabExperiment v-if="$route.query.lab !== 'no'" :labId="$route.query.i" />
    <div id="lab-cloak"></div>
  </div>
</template>

<style>
#bio-container {
  padding: 5vh 5vw;
  font-size: calc(22px + 0.33vw);
  width: 34em;
}

#bio-container h1 {
  font-size: 2.25em;
}

@media (min-width: 768px) {
  #bio-container {
    padding-left: 10vw;
    padding-right: 10vw;
  }
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
