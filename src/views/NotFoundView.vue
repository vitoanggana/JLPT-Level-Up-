<script setup>
import AppShell from '../components/AppShell.vue'
</script>

<template>
  <AppShell>
    <div class="panel empty-state">
      <p class="eyebrow">404</p>
      <h1 class="title" style="margin-bottom: 12px;">Route not found</h1>
      <p class="small-note">Halaman ini belum ada. Balik ke map untuk lanjut eksplorasi.</p>
      <div class="button-row" style="justify-content: center; margin-top: 20px;">
        <RouterLink class="btn btn-primary" to="/map">Go to Map</RouterLink>
      </div>
    </div>
  </AppShell>
</template>
