<script setup>
import AppShell from '../components/AppShell.vue'
</script>

<template>
  <AppShell>
    <section class="hero">
      <div>
        <p class="eyebrow">JLPT Adventure</p>
        <h1 class="title">Naik level bahasa Jepang lewat petualangan pulau.</h1>
        <p class="subtitle">
          Single-player mode jadi inti dulu: pemain menjelajah peta Jepang, menyelesaikan quiz per
          kategori, lalu membuka island berikutnya dari N5 sampai N1.
        </p>

        <div class="button-row" style="margin-top: 24px;">
          <RouterLink class="btn btn-primary" to="/map">Masuk ke Map</RouterLink>
          <RouterLink class="btn btn-secondary" to="/login">Lihat Alur Login</RouterLink>
        </div>

        <div class="stats-row" style="margin-top: 28px;">
          <div class="stat-card">
            Week 1
            <strong>Map Core</strong>
          </div>
          <div class="stat-card">
            MVP
            <strong>N5 First</strong>
          </div>
          <div class="stat-card">
            Target
            <strong>Unlock Loop</strong>
          </div>
        </div>
      </div>

      <div class="hero-visual">
        <div class="hero-island hero-island--n5">N5</div>
        <div class="hero-island hero-island--n4">N4</div>
        <div class="hero-island hero-island--n3">N3</div>
        <div class="hero-island hero-island--n2">N2</div>

        <div class="hero-path">
          <svg viewBox="0 0 100 100" fill="none" aria-hidden="true">
            <path
              d="M15 76 C32 70, 27 55, 42 50 S63 38, 74 27"
              stroke="#17313e"
              stroke-width="1.2"
              stroke-dasharray="3 4"
            />
          </svg>
        </div>
      </div>
    </section>
  </AppShell>
</template>
