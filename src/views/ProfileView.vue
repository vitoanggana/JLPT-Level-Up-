<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import AppShell from '../components/AppShell.vue'
import { jlptLevels } from '../data/levels'
import { useAuthStore } from '../stores/auth'
import { useProgressStore } from '../stores/progress'
import type { CategoryConfig } from '../types'

const router = useRouter()
const progressStore = useProgressStore()
const authStore = useAuthStore()

const userMetadata = computed(() => authStore.currentUser?.user_metadata || {})

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

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

async function handleDeleteAccount() {
  const confirmFirst = confirm('PERINGATAN: Menghapus akun akan menghilangkan semua progress dan data Anda secara permanen. Lanjutkan?')
  
  if (confirmFirst) {
    const confirmSecond = confirm('Apakah Anda benar-benar yakin? Tindakan ini tidak bisa dibatalkan.')
    
    if (confirmSecond) {
      const result = await authStore.deleteAccount()
      if (result.success) {
        alert(result.message)
        router.push('/login')
      } else {
        alert('Gagal menghapus akun: ' + result.message)
      }
    }
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
          </div>
        </div>

        <section class="panel profile-layout profile-panel">
          
          <div class="milestone-list">
            <div>Username: <strong>{{ userMetadata.nickname || 'Petualang Tanpa Nama' }}</strong></div>
            <div>Email: <strong>{{ authStore.currentUser?.email || '-' }}</strong></div>
            <div>Level saat ini: <strong>{{ progressStore.currentLevel.label }}</strong></div>
            <div>Anime Fav: <strong>{{ userMetadata.favorite_anime || 'Belum diisi' }}</strong></div>
          </div>

          <div v-if="authStore.isAdmin" class="profile-admin-tools" style="margin-top: 20px;">
            <p class="eyebrow">Alat Mock Admin</p>
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
          </div>

          <div class="button-row profile-panel__actions" style="margin-top: 30px; display: flex; flex-direction: column; gap: 10px;">
            <button class="btn btn-secondary" type="button" @click="progressStore.resetProgress()">
              Reset Progres Lokal
            </button>
            
            <button class="btn btn-danger" type="button" @click="handleLogout" style="background-color: #dc3545; color: white; border: none; padding: 10px; border-radius: 6px; width: 100%;">
              Keluar Akun
            </button>

            <button class="btn btn-link" type="button" @click="handleDeleteAccount" style="color: #666; background: none; border: none; font-size: 0.8rem; text-decoration: underline; margin-top: 10px;">
              Hapus Akun Permanen
            </button>
          </div>
          
        </section>
      </div>
    </section>
  </AppShell>
</template>