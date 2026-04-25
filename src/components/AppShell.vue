<script setup>
const navItems = [
  { label: 'Home', icon: 'HH', to: '/' },
  { label: 'Map', icon: 'JP', to: '/map' },
  { label: 'Profile', icon: 'ME', to: '/profile' },
]
</script>

<template>
  <div class="page-shell">
    <div class="app-frame">
      <div class="app-grid">
        <aside class="sidebar">
          <div class="sidebar__brand">JL</div>

          <nav class="sidebar__nav" aria-label="Primary">
            <RouterLink
              v-for="item in navItems"
              :key="item.to"
              class="nav-pill"
              :to="item.to"
              :title="item.label"
            >
              {{ item.icon }}
            </RouterLink>
          </nav>
        </aside>

        <main class="content">
          <slot />
        </main>
      </div>
    </div>
  </div>
</template>
