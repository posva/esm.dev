<script lang="ts" setup>
useCalButton()
</script>

<template>
  <button
    class="inline px-4 py-1 font-bold leading-normal tracking-tighter no-underline transition-shadow duration-300 border rounded-full shadow-inner lg:px-8 shadow-neutral-50 dark:hover:shadow-pink-200 dark:shadow-neutral-700 bg-neutral-100 dark:bg-neutral-800 dark:border-neutral-800 ring-inset active:shadow-neutral-300 dark:active:shadow-black dark:active:border-transparent"
    data-cal-link="posva/consultancy"
  >
    <slot>Book a call</slot>
  </button>
</template>

<style scoped>
[data-cal-link] {
  position: relative;
}

[data-cal-link]::before,
[data-cal-link]::after {
  content: '📅';
  position: absolute;
  top: 0%;
  left: 50%;

  transform: scale(0.2) translate(-50%, -50%);
  transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  animation: in-front 0.3s linear;
  animation-play-state: initial;
  animation-fill-mode: both;
  animation-direction: reverse;
}

@keyframes in-front {
  0% {
    z-index: -1;
  }
  90% {
    z-index: -1;
  }
  91% {
    z-index: 1;
  }
}

[data-cal-link]::before {
  content: '📅';
  transform: scale(0.2) translate(-100%, 50%);
}
[data-cal-link]::after {
  content: '👍';
  right: 0;
  transform: scale(0.2) translate(-100%, 50%);
}
[data-cal-link]:hover::before,
[data-cal-link]:focus::before,
[data-cal-link]:active::before {
  transform: scale(1.2) translate(-320%, -40%) rotateZ(-25deg);
  animation-direction: normal;
  animation-play-state: running;
}
[data-cal-link]:hover::after,
[data-cal-link]:focus::after,
[data-cal-link]:active::after {
  transform: scale(1.2) translate(31%, 40%) rotateZ(25deg);
  animation-direction: normal;
  animation-play-state: running;
}
</style>
