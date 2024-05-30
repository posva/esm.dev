<script setup lang="ts">
import { experimentModuleList, experimentModuleMap } from '~/lab'
import { toMeroiticCursiveNumber } from '~/lab/utils/meroitic'

const route = useRoute('labs-id')

const labId = computed(() => {
  const n = Number(route.params.id)
  if (!Number.isNaN(n)) return n

  // try to deduce from
  const index = experimentModuleList.findIndex(
    (m) => m.name === route.params.id
  )

  return index > -1 ? index : null
})

useHead({
  title: () =>
    labId.value == null
      ? `🧪 ???`
      : ` \u202a🧪 № ${toMeroiticCursiveNumber(Number(labId.value + 1))}`,
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
