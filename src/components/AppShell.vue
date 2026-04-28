<script setup>
import { useRouter } from 'vue-router'

import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const navItems = [
  { label: 'Beranda', icon: 'logo', to: '/' },
  { label: 'Map', icon: 'star', to: '/map' },
  { label: 'Profil', icon: 'profile', to: '/profile' },
]

function handleLogout() {
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
              :key="item.to"
              class="nav-pill"
              :to="item.to"
              :title="item.label"
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
            <button class="sidebar__logout" type="button" @click="handleLogout">
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
