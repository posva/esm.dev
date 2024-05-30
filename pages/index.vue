<script setup lang="ts">
import { vMagnetic } from '@/directives/vMagnetic'

definePageMeta({
  layout: 'barebones',
})

const { open: openCal } = useCalButton()

const title = 'Eduardo San Martin Morote'
const description = 'Hello! I am Eduardo and this is my website 🙂'

const route = useRoute('index')

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
      class="px-3 py-2 pb-4 space-y-6 shadow-lg bg-opacity-70 md:py-4 rounded-xl md:px-6 dark:bg-gray-950 bg-slate-100 dark:bg-opacity-70 backdrop-blur-md"
    >
      <h1 class="font-bold">Hi <span class="wave">👋</span></h1>
      <p>
        I'm
        <span id="my-name">
          <img src="/avatar.jpg" alt="picture of myself" />
          Eduardo</span
        >,
      </p>

      <main id="main" class="space-y-4">
        <p>
          an independent <b>Frontend Developer</b> deeply invested in
          <NuxtLink v-magnetic to="/open-source"><b>Open Source</b></NuxtLink
          >.
          <br />
          I'm part of the <Icon name="logos:vue" /> Vue.js Core Team, the author
          of <Icon name="logos:pinia" /> Pinia and Vue Router.
        </p>

        <p>
          You can find me giving
          <a
            href="https://www.youtube.com/results?search_query=eduardo+san+martin+morote"
            v-magnetic
            >talks at conferences</a
          >. and writing
          <NuxtLink v-magnetic to="/open-source">useful libraries</NuxtLink>,
          mostly for Vue, but not only, on
          <a v-magnetic href="https://github.com/posva">GitHub</a>.
        </p>

        <p>
          If you want to work together, please
          <a v-magnetic href="https://twitter.com/posva"
            >message me on Twitter</a
          >
          or
          <a href="#" v-magnetic @click.prevent="openCal('posva/consultancy')"
            >book a call</a
          >.
        </p>
      </main>
    </div>

    <LabExperiment
      v-if="route.query.lab !== 'no'"
      :labId="route.query.i || route.query.lab"
    />
    <div id="lab-cloak"></div>
  </div>
</template>

<style>
#bio-container {
  padding: 5vh 14px;
  font-size: calc(22px + 0.33vw);
  width: max(640px, 73vw);
  /* max-width: min(100%, 1400px); */
}

#bio-container .icon {
  /* fixes alignment of <Icon /> */
  vertical-align: text-top;
}

#bio-container h1 {
  font-size: 2.25em;
}

@media (min-width: 640px) {
  #bio-container {
    padding-left: 10vw;
    padding-right: 10vw;
    max-width: calc(800px + 20vw);
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

#my-name {
  display: inline-flex;
  align-items: baseline;
}

#my-name > img {
  height: 1em;
  border-radius: 100%;
  margin-right: 0.24em;
}
</style>
