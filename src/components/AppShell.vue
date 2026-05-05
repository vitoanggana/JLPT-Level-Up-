<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter, type RouteLocationRaw } from 'vue-router'

import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

interface NavItem {
  label: string
  icon: 'logo' | 'star' | 'profile'
  to: RouteLocationRaw
}

const navItems: NavItem[] = [
  { label: 'Beranda', icon: 'logo', to: '/' },
  { label: 'Peta', icon: 'star', to: '/map' },
  { label: 'Profil', icon: 'profile', to: '/profile' },
]

const handleNavClick = (e: Event) => {
  if (quizNavigationLocked.value) {
    e.preventDefault()
  }
}

const quizNavigationLocked = computed(() => route.name === 'quiz')

function handleLogout(): void {
  if (quizNavigationLocked.value) {
    return
  }

  authStore.logout()
  router.push('/login')
}
</script>

<template>
  <div class="page-shell">
    <div class="app-frame">
      <div class="app-grid">
        <aside class="sidebar">
          <div class="sidebar__brand" aria-hidden="true">
            <span class="sidebar-logo">
              <span class="sidebar-logo__dot"></span>
            </span>
          </div>

          <nav class="sidebar__nav" aria-label="Primary">
            <RouterLink
              v-for="item in navItems"
              :key="item.label"
              class="nav-pill"
              :class="{ 'nav-pill--disabled': quizNavigationLocked }"
              :to="item.to"
              :title="item.label"
              :aria-disabled="quizNavigationLocked"
              @click="handleNavClick"
            >
              <span class="nav-icon" :class="`nav-icon--${item.icon}`" aria-hidden="true"></span>
              <span class="sr-only">{{ item.label }}</span>
            </RouterLink>
          </nav>

          <div v-if="authStore.currentUser" class="sidebar__account">
            <div class="sidebar__account-card">
              <strong>{{ authStore.currentUser.role.toUpperCase() }}</strong>
              <span>{{ authStore.currentUser.name }}</span>
            </div>
            <button class="sidebar__logout" type="button" :disabled="quizNavigationLocked" @click="handleLogout">
              Keluar
            </button>
          </div>
        </aside>

        <main class="content">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
