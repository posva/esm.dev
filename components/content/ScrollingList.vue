<script lang="ts" setup></script>

<template>
  <div class="scrolling-list">
    <div class="item one"><slot /></div>
    <div class="item two"><slot /></div>
  </div>
</template>

<style scoped>
.scrolling-list {
  overflow: hidden;
  --duration: 30s;
  height: 300px;
  mask: linear-gradient(0deg, #0000, #000 5% 95%, #0000);
}

.item {
  /* border: 1px dashed red; */
  animation: infinite-scroll var(--duration) linear infinite;
  position: absolute;
  max-width: 100%;
}
.scrolling-list:hover .item {
  /* animation-play-state: running; */
  animation-play-state: paused;
}

.two {
  animation-delay: calc(-0.5 * var(--duration));
}

@keyframes infinite-scroll {
  /* 100 / n */
  50% {
    transform: translateY(-100%);
  }
  /* 100 / n + 0.01 */
  50.01% {
    transform: translateY(100%);
  }
}
</style>
