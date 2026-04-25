<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '../components/AppShell.vue'
import { jlptLevels } from '../data/levels'
import { useProgressStore } from '../stores/progress'

const route = useRoute()
const router = useRouter()
const progressStore = useProgressStore()

const island = computed(() => {
  return jlptLevels.find((level) => level.id === route.params.levelId)
})

const categoryStateMap = computed(() => {
  return progressStore.progress.levelScores[route.params.levelId]?.categories ?? {}
})

const islandMastery = computed(() => progressStore.getLevelScore(route.params.levelId))

const completedCount = computed(() => {
  return island.value?.categories.filter((category) => categoryStateMap.value[category.id]?.completed).length ?? 0
})

const coreCategoryIds = ['moji-goi', 'bunpou-dokkai', 'choukai']

const coreComplete = computed(() => {
  return coreCategoryIds.every((categoryId) => categoryStateMap.value[categoryId]?.completed)
})

function canPlayCategory(categoryId) {
  if (!progressStore.isUnlocked(route.params.levelId)) {
    return false
  }

  if (categoryId !== 'exam') {
    return true
  }

  return coreComplete.value
}

function categoryStatus(categoryId) {
  if (categoryStateMap.value[categoryId]?.completed) {
    return 'done'
  }

  if (!canPlayCategory(categoryId)) {
    return 'locked'
  }

  return 'open'
}

function completeCategory(categoryId) {
  if (!canPlayCategory(categoryId)) {
    return
  }

  if (route.params.levelId === 'n5' && categoryId === 'moji-goi') {
    router.push(`/quiz/${route.params.levelId}/${categoryId}`)
    return
  }

  progressStore.completeCategory(route.params.levelId, categoryId, 80)
}
</script>

<template>
  <AppShell>
    <div v-if="island" class="island-screen">
      <div class="island-stage">
        <div class="island-map-panel">
          <div class="island-map-fill" :style="{ background: island.themeColor }">
            <svg
              class="island-map-shape"
              viewBox="0 0 1020 780"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path :d="island.islandSilhouette || island.mapRegion.path" fill="currentColor" />
            </svg>

            <div class="island-route island-route--one"></div>
            <div class="island-route island-route--two"></div>

            <button
              v-for="category in island.categories"
              :key="category.id"
              class="island-node-card"
              :class="[
                `island-node-card--${category.islandNode?.size || 'medium'}`,
                `island-node-card--${categoryStatus(category.id)}`,
              ]"
              :style="{
                top: category.islandNode?.top || '50%',
                left: category.islandNode?.left || '50%',
              }"
              :disabled="!canPlayCategory(category.id)"
              @click="completeCategory(category.id)"
            >
              <span class="island-node-card__label">{{ category.title }}</span>
              <span class="island-node-card__count">
                {{ categoryStatus(category.id) === 'done' ? 'Done' : `${category.questions}` }}
              </span>
            </button>

            <div class="island-badge">{{ island.label }}</div>
          </div>
        </div>

        <div class="island-side-card">
          <p class="eyebrow">Island Overview</p>
          <h1 class="title" style="font-size: 40px;">{{ island.label }} Island</h1>
          <p class="small-note">{{ island.name }}</p>

          <div class="progress-bar" style="margin-top: 16px;">
            <span :style="{ width: `${islandMastery}%` }" />
          </div>
          <p class="small-note">{{ completedCount }} / {{ island.categories.length }} stage clear</p>

          <div class="milestone-list" style="margin-top: 18px;">
            <div v-for="milestone in island.milestones" :key="milestone">
              {{ milestone }}
            </div>
          </div>

          <div class="button-row" style="margin-top: 20px;">
            <button class="btn btn-secondary" type="button" @click="router.push('/map')">
              Back to Map
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="panel empty-state">
      <h1>Island tidak ditemukan</h1>
      <p class="small-note">Level yang dipilih belum ada di route saat ini.</p>
      <RouterLink class="btn btn-primary" to="/map">Balik ke Map</RouterLink>
    </div>
  </AppShell>
</template>
