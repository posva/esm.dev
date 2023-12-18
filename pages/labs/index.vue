<script lang="ts" setup>
import { experimentModuleMap, experimentModuleList } from '~/lab'
definePageMeta({
  layout: 'content',
})

const experimentId = useHead({
  title: '🧪 Labs',
})
</script>

<template>
  <h1>Labs</h1>

  <p>This is where I experiment with code.</p>

  <main>
    <ol>
      <li v-for="experiment of experimentModuleList">
        <NuxtLink :to="{ name: 'labs-id', params: { id: experiment.name } }">{{
          experiment.name
        }}</NuxtLink>
      </li>
    </ol>
  </main>
</template>
