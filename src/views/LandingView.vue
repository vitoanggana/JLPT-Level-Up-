<script setup lang="ts">
import AppShell from '../components/AppShell.vue'
</script>

<template>
  <AppShell>
    <section class="landing-screen">
      <div class="hero">
        <div class="hero-copy">
          <div class="hero-copy__panel">
            <p class="eyebrow">JLPT Adventure</p>
            <h1 class="title">Naik level bahasa Jepang lewat petualangan pulau. Dan bergelut bersama teman kamu yang sok jago jepang itu!</h1>
            <p class="subtitle">
              Jadi barudak ini website teh sangat bagus intinya mah support saya terus jangan israel.
            </p>

            <div class="button-row hero-copy__actions">
              <RouterLink class="btn btn-primary" to="/map">Masuk ke Peta</RouterLink>
              <RouterLink class="btn btn-primary" to="/pvp">By One JLPT!</RouterLink>
              <RouterLink class="btn btn-secondary" to="/login">Buka Login</RouterLink>
            </div>
          </div>

          <div class="stats-row hero-copy__stats">
            <div class="stat-card hero-stat-card">
              <span class="hero-stat-card__label">Scoreboard</span>
              <strong>Disini nanti ada scoreboard overall</strong>
            </div>
            <div class="stat-card hero-stat-card">
              <span class="hero-stat-card__label">MVP</span>
              <strong>ntar disini diliatin siapa MVP (yang paling jago), tpi ini belum aktif ya fiturnya</strong>
            </div>
            <div class="stat-card hero-stat-card">
              <span class="hero-stat-card__label">Target</span>
              <strong>gatau</strong>
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

            <img
              class="hero-japan-map"
              src="/island/full.png"
              alt="Peta level Jepang dari N5 sampai N1"
            />

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
