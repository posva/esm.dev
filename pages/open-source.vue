<script lang="ts" setup>
const { data } = await useAsyncData('oss-main', () =>
  queryContent('/open-source/_main').findOne()
)
</script>

<template>
  <main>
    <div
      class="w-full px-2 pt-16 mx-auto prose md:px-0 max-w-xxl lg:prose-xl dark:prose-invert"
    >
      <h1>Open Source Software</h1>

      <ContentQuery path="/open-source/_main" find="one" v-slot="{ data }">
        <ContentRenderer :value="data" />
      </ContentQuery>
    </div>
  </main>
</template>

<style scoped>
:deep(.scrolling-list ul) {
  margin-top: 0;
  margin-bottom: 0;
}
:deep(.scrolling-list ul:nth-child(1) li:last-child) {
  margin-bottom: 0;
}
:deep(.scrolling-list ul:nth-child(2) li:first-child) {
  margin-top: 0;
}
</style>
