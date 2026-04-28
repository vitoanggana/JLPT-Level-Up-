<script setup>
import AppShell from '../components/AppShell.vue'
import { jlptLevels } from '../data/levels'
</script>

<template>
  <AppShell>
    <section class="landing-screen">
      <div class="hero">
        <div class="hero-copy">
          <div class="hero-copy__panel">
            <p class="eyebrow">JLPT Adventure</p>
            <h1 class="title">Naik level bahasa Jepang lewat petualangan pulau.</h1>
            <p class="subtitle">
              Single-player mode jadi inti dulu: pemain menjelajah peta Jepang, menyelesaikan quiz
              per kategori, lalu membuka island berikutnya dari N5 sampai N1.
            </p>

            <div class="button-row hero-copy__actions">
              <RouterLink class="btn btn-primary" to="/map">Masuk ke Map</RouterLink>
              <RouterLink class="btn btn-secondary" to="/login">Buka Login</RouterLink>
            </div>
          </div>

          <div class="stats-row hero-copy__stats">
            <div class="stat-card hero-stat-card">
              <span class="hero-stat-card__label">Minggu 1</span>
              <strong>Inti Peta</strong>
            </div>
            <div class="stat-card hero-stat-card">
              <span class="hero-stat-card__label">MVP</span>
              <strong>N5 Dulu</strong>
            </div>
            <div class="stat-card hero-stat-card">
              <span class="hero-stat-card__label">Target</span>
              <strong>Buka Rantai</strong>
            </div>
          </div>
        </div>

        <div class="hero-visual hero-visual--map">
          <div class="hero-visual__glow hero-visual__glow--sun"></div>
          <div class="hero-visual__glow hero-visual__glow--sea"></div>

          <div class="hero-visual__panel">
            <p class="eyebrow">Rute Progres</p>
            <h2 class="hero-visual__title">Peta Level Jepang</h2>
            <p class="small-note hero-visual__note">Mulai dari N5 lalu buka rute sampai N1.</p>

            <svg
              class="hero-japan-map"
              viewBox="0 0 1040 640"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-label="Mini Japan map"
            >
              <g
                v-for="island in jlptLevels"
                :key="island.id"
                class="hero-map-region"
                :transform="`translate(${island.mapRegion.translateX || 0} ${island.mapRegion.translateY || 0})`"
              >
                <path
                  class="hero-map-region__shape"
                  :d="island.mapRegion.path"
                  :fill="island.themeColor"
                />
                <text
                  class="hero-map-region__label"
                  :x="island.mapRegion.labelX"
                  :y="island.mapRegion.labelY"
                >
                  {{ island.label }}
                </text>
              </g>
            </svg>

            <div class="hero-route-badges">
              <span class="badge">5 pulau</span>
              <span class="badge">4 node tiap level</span>
              <span class="badge">Progres berbasis peta</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  </AppShell>
</template>
