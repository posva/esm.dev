<script lang="ts" setup>
import AppHeader from './components/AppHeader.vue'
import AppFooter from './components/AppFooter.vue'
</script>

<template>
  <AppHeader></AppHeader>

  <slot name="before-content"></slot>

  <div
    class="w-full max-w-xl px-4 pt-16 mx-auto prose sm:px-0 lg:prose-xl dark:prose-invert prose-stone"
  >
    <slot></slot>
  </div>

  <slot name="after-content"></slot>

  <AppFooter></AppFooter>
</template>
