<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '../components/AppShell.vue'
import { getQuizDefinition } from '../data/quizzes'
import { jlptLevels } from '../data/levels'
import { useProgressStore } from '../stores/progress'
import type { CategoryConfig, CategoryId, CategoryProgressMap, LevelId } from '../types'

const route = useRoute()
const router = useRouter()
const progressStore = useProgressStore()
const levelId = computed(() => route.params.levelId as LevelId)

const island = computed(() => {
  return jlptLevels.find((level) => level.id === levelId.value) ?? null
})

const categoryStateMap = computed<CategoryProgressMap>(() => {
  return progressStore.progress.levelScores[levelId.value]?.categories ?? {}
})

const islandMastery = computed(() => progressStore.getLevelScore(levelId.value))

const completedCount = computed(() => {
  return island.value?.categories.filter((category) => categoryStateMap.value[category.id]?.completed).length ?? 0
})

type IslandNodeView = CategoryConfig & {
  top: string
  left: string
}

const islandNodes = computed<IslandNodeView[]>(() => {
  return (island.value?.categories ?? []).map((category) => ({
    ...category,
    top: category.islandNode?.top || '50%',
    left: category.islandNode?.left || '50%',
  }))
})

const routePath = computed(() => {
  const orderedIds: CategoryId[] = ['moji-goi', 'bunpou-dokkai', 'choukai', 'exam']
  const orderedNodes = orderedIds
    .map((categoryId) => islandNodes.value.find((category) => category.id === categoryId))
    .filter((category): category is IslandNodeView => Boolean(category))

  if (!orderedNodes.length) {
    return ''
  }

  const points = orderedNodes.map((node) => ({
    x: Number.parseFloat(node.left),
    y: Number.parseFloat(node.top),
  }))

  return points.reduce((path, point, index) => {
    if (index === 0) {
      return `M ${point.x} ${point.y}`
    }

    const previous = points[index - 1]
    const midX = (previous.x + point.x) / 2
    return `${path} C ${midX} ${previous.y}, ${midX} ${point.y}, ${point.x} ${point.y}`
  }, '')
})

function canPlayCategory(categoryId: CategoryId): boolean {
  return progressStore.canAccessCategory(levelId.value, categoryId)
}

function categoryStatus(categoryId: CategoryId): 'done' | 'locked' | 'open' {
  if (categoryStateMap.value[categoryId]?.completed) {
    return 'done'
  }

  if (!canPlayCategory(categoryId)) {
    return 'locked'
  }

  return 'open'
}

function completeCategory(categoryId: CategoryId): void {
  if (!canPlayCategory(categoryId)) {
    return
  }

  if (getQuizDefinition(levelId.value, categoryId)) {
    router.push(`/quiz/${levelId.value}/${categoryId}`)
    return
  }

  progressStore.completeCategory(levelId.value, categoryId, 80)
}
</script>

<template>
  <AppShell>
    <div v-if="island" class="island-screen">
      <div class="island-stage">
        <div class="island-map-panel">
          <div class="island-map-fill" :style="{ background: island.themeColor }">
            <svg
              class="island-route-map"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path class="island-route-map__back" :d="routePath" pathLength="100" />
              <path class="island-route-map__front" :d="routePath" pathLength="100" />
            </svg>

            <button
              v-for="category in islandNodes"
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
                {{ categoryStatus(category.id) === 'done' ? 'Selesai' : `${category.questions}` }}
              </span>
            </button>

            <div class="island-badge">{{ island.label }}</div>
          </div>
        </div>

        <div class="island-side-card">
          <p class="eyebrow">Ringkasan Pulau</p>
          <h1 class="title" style="font-size: 40px;">Pulau {{ island.label }}</h1>
          <p class="small-note">{{ island.name }}</p>

          <div class="progress-bar" style="margin-top: 16px;">
            <span :style="{ width: `${islandMastery}%` }" />
          </div>
          <p class="small-note">{{ completedCount }} / {{ island.categories.length }} tahap selesai</p>

          <div class="milestone-list" style="margin-top: 18px;">
            <div v-for="milestone in island.milestones" :key="milestone">
              {{ milestone }}
            </div>
          </div>

          <div class="milestone-list" style="margin-top: 18px;">
            <div v-for="category in island.categories" :key="`${category.id}-requirement`">
              {{ category.title }}: minimum {{ category.passingCorrect }}/{{ category.questions }} benar
            </div>
          </div>

          <div class="button-row" style="margin-top: 20px;">
            <button class="btn btn-secondary" type="button" @click="router.push('/map')">
              Kembali ke Peta
            </button>
          </div>
        </div>
      </div>
    </div>

    <div v-else class="panel empty-state">
      <h1>Pulau tidak ditemukan</h1>
      <p class="small-note">Level yang dipilih belum ada di route saat ini.</p>
      <RouterLink class="btn btn-primary" to="/map">Kembali ke Peta</RouterLink>
    </div>
  </AppShell>
</template>
