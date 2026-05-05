<script setup lang="ts">
import { computed } from 'vue'

import AppShell from '../components/AppShell.vue'
import { jlptLevels } from '../data/levels'
import { useAuthStore } from '../stores/auth'
import { useProgressStore } from '../stores/progress'
import type { CategoryConfig } from '../types'

const progressStore = useProgressStore()
const authStore = useAuthStore()
const currentLevelConfig = computed(() => {
  return jlptLevels.find((level) => level.id === progressStore.currentLevel.id) ?? null
})

function mockCompleteCategory(category: CategoryConfig): void {
  progressStore.completeCategory(
    progressStore.currentLevel.id,
    category.id,
    100,
    category.passingCorrect ?? category.questions,
  )
}

function mockCompleteCurrentLevel(): void {
  for (const category of currentLevelConfig.value?.categories ?? []) {
    mockCompleteCategory(category)
  }
}
</script>

<template>
  <AppShell>
    <section class="profile-screen">
      <div class="profile-stack">
        <div class="section-head profile-head">
          <div>
            <p class="eyebrow">Profil Pemain</p>
            <h1 class="title">Profil petualang</h1>
            <p class="subtitle">
              Halaman ini nanti berkembang jadi tempat rank, statistik, verifikasi JLPT, dan loadout PvP.
              Untuk arsitektur awal, cukup tampilkan status progression.
            </p>
          </div>
        </div>

        <section class="panel profile-layout profile-panel">
          <div class="milestone-list">
            <div>Nama akun: {{ authStore.currentUser?.name ?? 'Tamu' }}</div>
            <div>Peran akun: {{ authStore.currentUser?.role ?? '-' }}</div>
            <div>ID login: {{ authStore.currentUser?.loginId ?? '-' }}</div>
            <div>Email: {{ authStore.currentUser?.email ?? '-' }}</div>
            <div>Pulau saat ini: {{ progressStore.currentLevel.label }}</div>
            <div>Total terbuka: {{ progressStore.totalUnlocked }}</div>
            <div>Total tuntas: {{ progressStore.totalCompleted }}</div>
            <div>Mastery saat ini: {{ progressStore.getLevelScore(progressStore.currentLevel.id) }}%</div>
          </div>

          <div v-if="authStore.isAdmin" class="profile-admin-tools">
            <p class="eyebrow">Alat Mock Admin</p>
            <div class="milestone-list">
              <div>Selesaikan cepat untuk level aktif: {{ progressStore.currentLevel.label }}</div>
            </div>

            <div class="button-row profile-panel__actions profile-panel__actions--stack">
              <button
                v-for="category in currentLevelConfig?.categories ?? []"
                :key="`mock-${category.id}`"
                class="btn btn-primary"
                type="button"
                @click="mockCompleteCategory(category)"
              >
                Selesaikan {{ category.title }}
              </button>
            </div>

            <div class="button-row profile-panel__actions">
              <button class="btn btn-primary" type="button" @click="mockCompleteCurrentLevel">
                Selesaikan Semua Level Aktif
              </button>
            </div>
          </div>

          <div class="button-row profile-panel__actions">
            <button class="btn btn-secondary" type="button" @click="progressStore.resetProgress()">
              Reset Progres Lokal
            </button>
            <button class="btn btn-secondary" type="button" @click="authStore.resetSeedUsers()">
              Reset Akun Seed
            </button>
          </div>
        </section>
      </div>
    </section>
  </AppShell>
</template>
