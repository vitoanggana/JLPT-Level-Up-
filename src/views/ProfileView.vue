<script setup>
import AppShell from '../components/AppShell.vue'
import { useProgressStore } from '../stores/progress'

const progressStore = useProgressStore()
</script>

<template>
  <AppShell>
    <div class="section-head">
      <div>
        <p class="eyebrow">Player Profile</p>
        <h1 class="title">Adventurer profile</h1>
        <p class="subtitle">
          Page ini nanti berkembang jadi tempat rank, statistik, verifikasi JLPT, dan loadout PvP.
          Untuk starter architecture, cukup tampilkan status progression.
        </p>
      </div>
    </div>

    <section class="panel profile-layout">
      <div class="milestone-list">
        <div>Current island: {{ progressStore.currentLevel.label }}</div>
        <div>Total unlocked: {{ progressStore.totalUnlocked }}</div>
        <div>Total cleared: {{ progressStore.totalCompleted }}</div>
        <div>Current mastery: {{ progressStore.getLevelScore(progressStore.currentLevel.id) }}%</div>
      </div>

      <div class="button-row" style="margin-top: 20px;">
        <button class="btn btn-secondary" type="button" @click="progressStore.resetProgress()">
          Reset Local Progress
        </button>
      </div>
    </section>
  </AppShell>
</template>
