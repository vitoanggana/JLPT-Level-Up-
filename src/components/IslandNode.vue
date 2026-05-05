<script setup lang="ts">
interface IslandNodeItem {
  id: string
  label: string
  name: string
  statusLabel: string
  themeColor: string
  position: {
    top: string
    left: string
  }
}

const props = withDefaults(defineProps<{
  island: IslandNodeItem
  status: string
  active?: boolean
}>(), {
  active: false,
})

const emit = defineEmits<{
  select: [id: string]
}>()

function handleClick(): void {
  if (props.status === 'locked') {
    return
  }

  emit('select', props.island.id)
}
</script>

<template>
  <button
    class="island-node"
    :class="[
      `island-node--${status}`,
      { 'island-node--active': active },
    ]"
    :style="{
      top: island.position.top,
      left: island.position.left,
      background: status === 'locked' ? undefined : island.themeColor,
    }"
    @click="handleClick"
  >
    <div class="island-node__level">{{ island.label }}</div>
    <div class="island-node__name">{{ island.name }}</div>
    <div class="island-node__status">{{ island.statusLabel }}</div>
  </button>
</template>
