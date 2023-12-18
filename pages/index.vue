<script setup lang="ts">
import { vMagnetic } from '@/directives/vMagnetic'

definePageMeta({
  layout: 'barebones',
})

const title = 'Eduardo San Martin Morote'
const description = 'Hello! I am Eduardo and this is my website 🙂'

useHead({
  meta: [
    {
      hid: 'description',
      name: 'description',
      content: description,
    },
    // <meta name="apple-mobile-web-app-status-bar-style" content="black" />

    // Open Graph data
    { property: 'og:title', content: title },
    { property: 'og:type', content: 'website' },
    { property: 'og:url', content: 'https://esm.dev' },
    { property: 'og:image', content: 'https://esm.dev/media-preview.png' },
    { property: 'og:description', content: description },
    // Twitter Card data
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@posva' },
    { name: 'twitter:creator', content: '@posva' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: 'https://esm.dev/media-preview.png' },
  ],
})
</script>

<template>
  <div class="relative max-w-full leading-tight" id="bio-container">
    <div
      class="px-3 py-2 pb-4 space-y-6 bg-opacity-75 shadow-lg md:py-4 rounded-xl md:px-6 dark:bg-gray-950 bg-slate-100 dark:bg-opacity-80"
    >
      <h1 class="font-bold">Hi <span id="wave">👋</span></h1>
      <p>
        <!-- <img src="assets/casual-me.jpg" alt="picture of myself" /> -->
        I'm Eduardo,
      </p>

      <main id="main" class="space-y-4">
        <p>
          a Frontend Nerd. I work as a consultant to help you keep your
          applications maintainable. I also give
          <NuxtLink v-magnetic to="/workshops">Vue.js trainings</NuxtLink> and
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
        <p>
          If you want to work together, please
          <a v-magnetic href="https://twitter.com/posva"
            >send me a PM on Twitter</a
          >.
        </p>
      </main>
    </div>

    <LabExperiment
      v-if="$route.query.lab !== 'no'"
      :labId="$route.query.i || $route.query.lab"
    />
    <div id="lab-cloak"></div>
  </div>
</template>

<style>
#bio-container {
  padding: 5vh 14px;
  font-size: calc(22px + 0.33vw);
  width: 34em;
}

#bio-container h1 {
  font-size: 2.25em;
}

@media (min-width: 640px) {
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

#wave {
  transform: rotate(-15deg);
  will-change: transform;
  display: inline-block;
  animation: waveAnimation 2s ease-in-out infinite alternate 2s;
  transform-origin: 70% 70%;
}
</style>
