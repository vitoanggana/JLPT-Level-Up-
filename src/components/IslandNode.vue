<script setup>
const props = defineProps({
  island: {
    type: Object,
    required: true,
  },
  status: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['select'])

function handleClick() {
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
