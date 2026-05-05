<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import AppShell from '../components/AppShell.vue'
import { jlptLevels } from '../data/levels'
import { useProgressStore } from '../stores/progress'
import type { LevelConfig, LevelId } from '../types'

const router = useRouter()
const progressStore = useProgressStore()
const previewIslandId = ref<LevelId>(progressStore.progress.selectedLevel ?? 'n5')
const mapViewport = ref<HTMLElement | null>(null)
const isDragging = ref(false)
const dragMoved = ref(false)
const suppressClick = ref(false)

const dragState: {
  pointerId: number | null
  startX: number
  startY: number
} = {
  pointerId: null,
  startX: 0,
  startY: 0,
}

const previewIsland = computed<LevelConfig>(() => {
  return jlptLevels.find((level) => level.id === previewIslandId.value) ?? jlptLevels[0]
})

const previewCompletedCount = computed(() => {
  return previewIsland.value.categories.filter((category) => {
    const categoryState = progressStore.progress.levelScores[previewIsland.value.id]?.categories?.[category.id]
    return categoryState?.completed
  }).length
})

function getIslandStatus(levelId: LevelId): 'completed' | 'unlocked' | 'locked' {
  if (progressStore.isCompleted(levelId)) {
    return 'completed'
  }

  if (progressStore.isUnlocked(levelId)) {
    return 'unlocked'
  }

  return 'locked'
}

function handleHover(levelId: LevelId): void {
  previewIslandId.value = levelId
}

function openIsland(levelId: LevelId): void {
  if (suppressClick.value) {
    suppressClick.value = false
    return
  }

  if (!progressStore.isUnlocked(levelId)) {
    return
  }

  progressStore.selectLevel(levelId)
  router.push(`/island/${levelId}`)
}

function syncHoverFromPoint(clientX: number, clientY: number): void {
  const hoveredElement = document.elementFromPoint(clientX, clientY)
  const hoveredRegion = hoveredElement?.closest?.('[data-level-id]') as HTMLElement | null

  if (hoveredRegion?.dataset?.levelId) {
    handleHover(hoveredRegion.dataset.levelId as LevelId)
  }
}

function handlePointerDown(event: PointerEvent): void {
  if (event.button != null && event.button !== 0) {
    return
  }

  isDragging.value = true
  dragMoved.value = false
  dragState.pointerId = event.pointerId
  dragState.startX = event.clientX
  dragState.startY = event.clientY

  const currentTarget = event.currentTarget as HTMLElement | null
  currentTarget?.setPointerCapture?.(event.pointerId)
  syncHoverFromPoint(event.clientX, event.clientY)
}

function handlePointerMove(event: PointerEvent): void {
  if (!isDragging.value || dragState.pointerId !== event.pointerId) {
    return
  }

  const deltaX = event.clientX - dragState.startX
  const deltaY = event.clientY - dragState.startY

  if (!dragMoved.value && (Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4)) {
    dragMoved.value = true
  }

  syncHoverFromPoint(event.clientX, event.clientY)
}

function finishDrag(event: PointerEvent): void {
  if (dragState.pointerId != null && event?.currentTarget) {
    const currentTarget = event.currentTarget as HTMLElement | null
    currentTarget?.releasePointerCapture?.(dragState.pointerId)
  }

  isDragging.value = false
  if (dragMoved.value) {
    suppressClick.value = true
    window.setTimeout(() => {
      suppressClick.value = false
    }, 0)
  }
  dragState.pointerId = null
}
</script>

<template>
  <AppShell>
    <section class="map-screen">
      <div class="map-stage">
        <div class="map-canvas">
          <div
            ref="mapViewport"
            class="map-viewport"
            :class="{ 'map-viewport--dragging': isDragging }"
            @pointerdown="handlePointerDown"
            @pointermove="handlePointerMove"
            @pointerup="finishDrag"
            @pointercancel="finishDrag"
            @pointerleave="finishDrag"
          >
            <svg
              class="japan-map-svg"
              viewBox="0 0 1240 860"
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
                :data-level-id="island.id"
                :transform="`translate(${island.mapRegion.translateX || 0} ${island.mapRegion.translateY || 0})`"
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
        </div>

        <div class="map-floating-card">
          <p class="eyebrow">Pratinjau Peta</p>
          <h2 class="map-floating-card__title">{{ previewIsland.label }}</h2>
          <p class="small-note" style="margin-top: 4px;">{{ previewIsland.name }}</p>
          <p class="small-note">{{ previewIsland.statusLabel }}</p>

          <div class="progress-bar" style="margin-top: 14px;">
            <span :style="{ width: `${progressStore.getLevelScore(previewIsland.id)}%` }" />
          </div>

          <p class="small-note">
            {{ previewCompletedCount }} / {{ previewIsland.categories.length }} kategori selesai
          </p>

          <div class="button-row" style="margin-top: 16px;">
            <button
              class="btn btn-primary"
              type="button"
              :disabled="!progressStore.isUnlocked(previewIsland.id)"
              @click="openIsland(previewIsland.id)"
            >
              Masuk Pulau
            </button>
            <span class="badge">
              {{ progressStore.isUnlocked(previewIsland.id) ? 'Terbuka' : 'Terkunci' }}
            </span>
          </div>
        </div>
      </div>

      <div class="map-footer">
        <div class="map-footer__meta">
          <span class="badge">{{ progressStore.totalUnlocked }} terbuka</span>
          <span class="badge">{{ progressStore.totalCompleted }} tuntas</span>
          <span class="badge">Klik pulau yang terbuka untuk masuk</span>
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
