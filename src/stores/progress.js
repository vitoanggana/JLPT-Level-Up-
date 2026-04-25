import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { jlptLevels, starterProgress } from '../data/levels'

const STORAGE_KEY = 'jlpt-level-up-progress'

function cloneStarterProgress() {
  return JSON.parse(JSON.stringify(starterProgress))
}

function createEmptyLevelScore(levelId) {
  const level = jlptLevels.find((item) => item.id === levelId)
  const categories = {}

  for (const category of level?.categories ?? []) {
    categories[category.id] = {
      completed: false,
      score: 0,
    }
  }

  return {
    mastery: 0,
    categories,
  }
}

function normalizeProgress(rawProgress) {
  const normalized = {
    ...cloneStarterProgress(),
    ...rawProgress,
    levelScores: {
      ...cloneStarterProgress().levelScores,
      ...(rawProgress?.levelScores ?? {}),
    },
  }

  for (const level of jlptLevels) {
    const currentLevelScore = normalized.levelScores[level.id] ?? createEmptyLevelScore(level.id)

    currentLevelScore.categories = {
      ...createEmptyLevelScore(level.id).categories,
      ...(currentLevelScore.categories ?? {}),
    }

    const categoryEntries = Object.values(currentLevelScore.categories)
    const totalScore = categoryEntries.reduce((sum, item) => sum + (item.score ?? 0), 0)
    currentLevelScore.mastery = categoryEntries.length
      ? Math.round(totalScore / categoryEntries.length)
      : 0

    normalized.levelScores[level.id] = currentLevelScore
  }

  return normalized
}

function loadProgress() {
  const raw = localStorage.getItem(STORAGE_KEY)

  if (!raw) {
    return normalizeProgress(cloneStarterProgress())
  }

  try {
    return normalizeProgress(JSON.parse(raw))
  } catch {
    return normalizeProgress(cloneStarterProgress())
  }
}

export const useProgressStore = defineStore('progress', () => {
  const progress = ref(loadProgress())

  const currentLevel = computed(() => {
    return jlptLevels.find((level) => level.id === progress.value.selectedLevel) ?? jlptLevels[0]
  })

  const totalUnlocked = computed(() => progress.value.unlockedLevels.length)
  const totalCompleted = computed(() => progress.value.completedLevels.length)

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress.value))
  }

  function selectLevel(levelId) {
    progress.value.selectedLevel = levelId
    persist()
  }

  function isUnlocked(levelId) {
    return progress.value.unlockedLevels.includes(levelId)
  }

  function isCompleted(levelId) {
    return progress.value.completedLevels.includes(levelId)
  }

  function getLevelScore(levelId) {
    return progress.value.levelScores[levelId]?.mastery ?? 0
  }

  function completeCategory(levelId, categoryId, score = 80) {
    const levelScore = progress.value.levelScores[levelId] ?? createEmptyLevelScore(levelId)
    const currentCategory = levelScore.categories[categoryId] ?? { completed: false, score: 0 }
    const unlockedBefore = new Set(progress.value.unlockedLevels)

    levelScore.categories[categoryId] = {
      ...currentCategory,
      completed: true,
      score,
    }

    const categoryEntries = Object.values(levelScore.categories)
    const totalScore = categoryEntries.reduce((sum, item) => sum + (item.score ?? 0), 0)
    levelScore.mastery = Math.round(totalScore / categoryEntries.length)
    progress.value.levelScores[levelId] = levelScore

    const allCategoriesComplete = categoryEntries.every((item) => item.completed)

    if (allCategoriesComplete && !progress.value.completedLevels.includes(levelId)) {
      progress.value.completedLevels.push(levelId)

      const currentIndex = jlptLevels.findIndex((level) => level.id === levelId)
      const nextLevel = jlptLevels[currentIndex + 1]

      if (nextLevel && !progress.value.unlockedLevels.includes(nextLevel.id)) {
        progress.value.unlockedLevels.push(nextLevel.id)
      }
    }

    persist()

    const currentIndex = jlptLevels.findIndex((level) => level.id === levelId)
    const nextLevel = jlptLevels[currentIndex + 1]

    return {
      completedLevel: allCategoriesComplete,
      unlockedNextLevel: Boolean(nextLevel && !unlockedBefore.has(nextLevel.id) && progress.value.unlockedLevels.includes(nextLevel.id)),
      nextLevelId: nextLevel?.id ?? null,
    }
  }

  function resetProgress() {
    progress.value = normalizeProgress(cloneStarterProgress())
    persist()
  }

  return {
    progress,
    currentLevel,
    totalUnlocked,
    totalCompleted,
    selectLevel,
    isUnlocked,
    isCompleted,
    getLevelScore,
    completeCategory,
    resetProgress,
  }
})
