<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppShell from '../components/AppShell.vue'
import { jlptLevels } from '../data/levels'
import { useProgressStore } from '../stores/progress'

const router = useRouter()
const progressStore = useProgressStore()
const previewIslandId = ref(progressStore.progress.selectedLevel ?? 'n5')

const previewIsland = computed(() => {
  return jlptLevels.find((level) => level.id === previewIslandId.value) ?? jlptLevels[0]
})

const previewCompletedCount = computed(() => {
  return previewIsland.value.categories.filter((category) => {
    const categoryState = progressStore.progress.levelScores[previewIsland.value.id]?.categories?.[category.id]
    return categoryState?.completed
  }).length
})

function getIslandStatus(levelId) {
  if (progressStore.isCompleted(levelId)) {
    return 'completed'
  }

  if (progressStore.isUnlocked(levelId)) {
    return 'unlocked'
  }

  return 'locked'
}

function handleHover(levelId) {
  previewIslandId.value = levelId
}

function openIsland(levelId) {
  if (!progressStore.isUnlocked(levelId)) {
    return
  }

  progressStore.selectLevel(levelId)
  router.push(`/island/${levelId}`)
}
</script>

<template>
  <AppShell>
    <section class="map-screen">
      <div class="map-stage">
        <div class="map-canvas">
          <svg
            class="japan-map-svg"
            viewBox="0 0 1040 640"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-label="JLPT Japan map"
          >
            <g
              v-for="island in jlptLevels"
              :key="island.id"
              class="map-region"
              :class="[
                `map-region--${getIslandStatus(island.id)}`,
                { 'map-region--active': previewIsland.id === island.id },
              ]"
              @mouseenter="handleHover(island.id)"
              @focusin="handleHover(island.id)"
              @click="openIsland(island.id)"
            >
              <path
                class="map-region__shape"
                :d="island.mapRegion.path"
                :fill="island.themeColor"
              />
              <text
                class="map-region__label"
                :x="island.mapRegion.labelX"
                :y="island.mapRegion.labelY"
              >
                {{ island.label }}
              </text>
            </g>
          </svg>
        </div>

        <div class="map-floating-card">
          <p class="eyebrow">Map Preview</p>
          <h2 class="map-floating-card__title">{{ previewIsland.label }}</h2>
          <p class="small-note" style="margin-top: 4px;">{{ previewIsland.name }}</p>
          <p class="small-note">{{ previewIsland.statusLabel }}</p>

          <div class="progress-bar" style="margin-top: 14px;">
            <span :style="{ width: `${progressStore.getLevelScore(previewIsland.id)}%` }" />
          </div>

          <p class="small-note">
            {{ previewCompletedCount }} / {{ previewIsland.categories.length }} category selesai
          </p>

          <div class="button-row" style="margin-top: 16px;">
            <button
              class="btn btn-primary"
              type="button"
              :disabled="!progressStore.isUnlocked(previewIsland.id)"
              @click="openIsland(previewIsland.id)"
            >
              Enter Island
            </button>
            <span class="badge">
              {{ progressStore.isUnlocked(previewIsland.id) ? 'Unlocked' : 'Locked' }}
            </span>
          </div>
        </div>
      </div>

      <div class="map-footer">
        <div class="map-footer__meta">
          <span class="badge">{{ progressStore.totalUnlocked }} unlocked</span>
          <span class="badge">{{ progressStore.totalCompleted }} cleared</span>
          <span class="badge">Click any unlocked island to enter</span>
        </div>

        <div class="map-footer__categories">
          <div
            v-for="category in previewIsland.categories"
            :key="category.id"
            class="map-category-chip"
          >
            <strong>{{ category.title }}</strong>
            <span>{{ category.questions }}Q</span>
          </div>
        </div>
      </div>
    </section>
  </AppShell>
</template>
