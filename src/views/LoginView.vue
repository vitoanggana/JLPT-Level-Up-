<script setup>
import AppShell from '../components/AppShell.vue'
</script>

<template>
  <AppShell>
    <div class="section-head">
      <div>
        <p class="eyebrow">Week 1</p>
        <h1 class="title">Auth flow placeholder</h1>
        <p class="subtitle">
          Untuk week 1 kita belum butuh backend dulu. Halaman ini cukup jadi penanda alur login dan
          register sebelum nanti disambung ke Supabase atau backend sendiri.
        </p>
      </div>
    </div>

    <div class="panel auth-card">
      <div class="form-stack">
        <label class="field">
          <span>Email</span>
          <input type="email" placeholder="adventurer@jlpt.quest" />
        </label>

        <label class="field">
          <span>Password</span>
          <input type="password" placeholder="********" />
        </label>

        <div class="button-row">
          <button class="btn btn-primary" type="button">Mock Login</button>
          <RouterLink class="btn btn-secondary" to="/map">Skip ke Map</RouterLink>
        </div>
      </div>
    </div>
  </AppShell>
</template>
