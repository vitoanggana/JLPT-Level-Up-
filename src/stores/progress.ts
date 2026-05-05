import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { jlptLevels, starterProgress } from '../data/levels'
import type {
  CategoryConfig,
  CategoryId,
  CategoryProgressMap,
  CategoryProgressState,
  CompleteCategoryResult,
  LevelId,
  LevelProgressState,
  ProgressState,
} from '../types'

const STORAGE_KEY = 'jlpt-level-up-progress'

function cloneStarterProgress(): ProgressState {
  return JSON.parse(JSON.stringify(starterProgress)) as ProgressState
}

function createEmptyCategoryState(): CategoryProgressState {
  return {
    completed: false,
    score: 0,
    correctCount: 0,
  }
}

function createEmptyLevelScore(levelId: LevelId): LevelProgressState {
  const level = jlptLevels.find((item) => item.id === levelId)
  const categories: CategoryProgressMap = {}

  for (const category of level?.categories ?? []) {
    categories[category.id] = createEmptyCategoryState()
  }

  return {
    mastery: 0,
    categories,
  }
}

function normalizeProgress(rawProgress: unknown): ProgressState {
  const partialProgress = (rawProgress ?? {}) as Partial<ProgressState>
  const normalized: ProgressState = {
    ...cloneStarterProgress(),
    ...partialProgress,
    levelScores: {
      ...cloneStarterProgress().levelScores,
      ...(partialProgress.levelScores ?? {}),
    },
  }

  for (const level of jlptLevels) {
    const currentLevelScore = normalized.levelScores[level.id] ?? createEmptyLevelScore(level.id)

    currentLevelScore.categories = {
      ...createEmptyLevelScore(level.id).categories,
      ...(currentLevelScore.categories ?? {}),
    }

    const categoryEntries = Object.values(currentLevelScore.categories).filter(Boolean) as CategoryProgressState[]
    const totalScore = categoryEntries.reduce((sum, item) => sum + (item.score ?? 0), 0)
    currentLevelScore.mastery = categoryEntries.length
      ? Math.round(totalScore / categoryEntries.length)
      : 0

    normalized.levelScores[level.id] = currentLevelScore
  }

  return normalized
}

function loadProgress(): ProgressState {
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
  const progress = ref<ProgressState>(loadProgress())

  const currentLevel = computed(() => {
    return jlptLevels.find((level) => level.id === progress.value.selectedLevel) ?? jlptLevels[0]
  })

  const totalUnlocked = computed(() => progress.value.unlockedLevels.length)
  const totalCompleted = computed(() => progress.value.completedLevels.length)

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress.value))
  }

  function selectLevel(levelId: LevelId): void {
    progress.value.selectedLevel = levelId
    persist()
  }

  function isUnlocked(levelId: LevelId): boolean {
    return progress.value.unlockedLevels.includes(levelId)
  }

  function isCompleted(levelId: LevelId): boolean {
    return progress.value.completedLevels.includes(levelId)
  }

  function getLevelScore(levelId: LevelId): number {
    return progress.value.levelScores[levelId]?.mastery ?? 0
  }

  function getCategoryConfig(levelId: LevelId, categoryId: CategoryId): CategoryConfig | null {
    return jlptLevels.find((level) => level.id === levelId)?.categories.find((category) => category.id === categoryId) ?? null
  }

  function isCategoryCompleted(levelId: LevelId, categoryId: CategoryId): boolean {
    return Boolean(progress.value.levelScores[levelId]?.categories?.[categoryId]?.completed)
  }

  function canAccessCategory(levelId: LevelId, categoryId: CategoryId): boolean {
    if (!isUnlocked(levelId)) {
      return false
    }

    const category = getCategoryConfig(levelId, categoryId)
    const unlockAfter = category?.unlockAfter ?? []

    return unlockAfter.every((requiredCategoryId) => isCategoryCompleted(levelId, requiredCategoryId))
  }

  function completeCategory(levelId: LevelId, categoryId: CategoryId, score = 80, correctCount = 0): CompleteCategoryResult {
    const levelScore = progress.value.levelScores[levelId] ?? createEmptyLevelScore(levelId)
    const currentCategory = levelScore.categories[categoryId] ?? createEmptyCategoryState()
    const categoryConfig = getCategoryConfig(levelId, categoryId)
    const unlockedBefore = new Set(progress.value.unlockedLevels)
    const passingCorrect = categoryConfig?.passingCorrect ?? 0
    const passed = correctCount >= passingCorrect

    levelScore.categories[categoryId] = {
      ...currentCategory,
      completed: passed,
      score,
      correctCount,
    }

    const categoryEntries = Object.values(levelScore.categories).filter(Boolean) as CategoryProgressState[]
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
      passed,
      passingCorrect,
      correctCount,
      completedLevel: allCategoriesComplete,
      unlockedNextLevel: Boolean(nextLevel && !unlockedBefore.has(nextLevel.id) && progress.value.unlockedLevels.includes(nextLevel.id)),
      nextLevelId: nextLevel?.id ?? null,
    }
  }

  function resetProgress(): void {
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
    getCategoryConfig,
    isCategoryCompleted,
    canAccessCategory,
    completeCategory,
    resetProgress,
  }
})
