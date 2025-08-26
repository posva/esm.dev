<script lang="ts" setup>
import { experimentModuleList } from '~/lab'

const experimentId = useHead({
  title: '🧪 Labs',
})
</script>

<template>
  <div
    class="w-full max-w-xl px-4 pt-16 mx-auto prose sm:px-0 lg:prose-xl dark:prose-invert prose-stone"
  >
    <h1>Labs</h1>

    <p>This is where I experiment with code.</p>

    <main>
      <ol>
        <li v-for="experiment of experimentModuleList">
          <NuxtLink
            :to="{ name: 'labs-id', params: { id: experiment.name } }"
            >{{ experiment.name }}</NuxtLink
          >
        </li>
      </ol>
    </main>
  </div>
</template>
