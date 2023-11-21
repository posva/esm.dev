<script setup lang="ts">
const route = useRoute('labs-id')
const labId = computed(() => {
  const n = Number(route.params.id)
  return Number.isNaN(n) ? null : n
})
</script>

<template>
  <div id="lab" class="min-h-full">
    <LabExperiment :lab-id="labId" />

    <!-- <div class="my-4"></div> -->

    <!-- <section class="px-4">
      <h1>Hey there</h1>

        <p>
          Lorem ipsum dolor sit amet consectetur, adipisicing elit. Atque,
          deserunt minima! Laudantium, fuga cumque. Assumenda modi eveniet nam
          facilis error, et ab rem magnam nemo blanditiis? Odio earum repellendus
          quisquam!
        </p>
      </section> -->
  </div>
</template>

<style scoped>
#lab :deep(#experiment) {
  position: initial;
  /* width: 100%;
  height: 100%; */
}
</style>
