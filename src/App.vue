<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import { useAuthStore } from './stores/auth'
import { useProgressStore } from './stores/progress'

const authStore = useAuthStore()
const progressStore = useProgressStore()

onMounted(async () => {
  await authStore.initializeAuth()
  if (authStore.isAuthenticated) {
    await progressStore.syncFromCloud()
  }
})
</script>

<template>
  <RouterView />
</template>