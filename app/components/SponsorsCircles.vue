<script setup lang="ts">
// copied from antfu.me
// not working yet as it's missing the tooltip directive and some of the classes for style
import sponsors from '../../data/sponsors-circles.json'

const lastHovered = ref<string[]>([])

function push(id: string) {
  if (lastHovered.value.includes(id)) lastHovered.value = lastHovered.value.filter((i) => i !== id)
  lastHovered.value.push(id)
  if (lastHovered.value.length > 5) lastHovered.value.unshift()
}

const scale = ref(1)

onMounted(() => {
  const { width } = useWindowSize()
  watch(
    width,
    () => {
      scale.value = Math.min(2, (width.value - 80) / 500)
    },
    { immediate: true },
  )
})
</script>

<template>
  <div
    class="flex justify-center w-full"
    :style="{
      height: `${550 * scale}px`,
    }"
  >
    <div
      class="relative w-500px h-500px group ma"
      :style="{
        'flex-shrink': 0,
        transform: `scale(${scale})`,
        transformOrigin: 'center center',
      }"
    >
      <a
        v-for="c in sponsors"
        :key="c.id"
        v-tooltip="[c.name, `@${c.login}`].filter(Boolean).join(' ')"
        :style="{
          width: `${c.radius * 2}px`,
          height: `${c.radius * 2}px`,
          left: `${c.position.x - c.radius}px`,
          top: `${c.position.y - c.radius}px`,
          zIndex: lastHovered.indexOf(c.id) + 1,
        }"
        class="absolute transition-all duration-500 rounded-1/2 of-hidden hover:shadow-lg"
        :class="[
          c.org ? 'hover:rounded-xl' : '',
          c.radius < 10
            ? 'hover:scale-200'
            : c.radius < 20
              ? 'hover:scale-150'
              : c.radius < 50
                ? 'hover:scale-125'
                : 'hover:scale-110',
          c.radius > 25 ? 'border-0.5 border-base' : '',
        ]"
        :href="c.link"
        target="_blank"
        :title="c.name || c.login"
        @mouseenter="push(c.id)"
      >
        <img v-if="c.avatar" :src="c.avatar" class="w-full h-full bg-base" />
        <div v-else class="flex w-full h-full bg-gray:50">
          <div i-ph-user ma op75 class="w-50% h-50%" />
        </div>
      </a>
    </div>
  </div>
</template>
