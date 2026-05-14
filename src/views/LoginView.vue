<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '../components/AppShell.vue'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

// State Umum (Login & Daftar)
const email = ref('')
const password = ref('')

// State Khusus Daftar
const confirmPassword = ref('')
const nickname = ref('')
const favoriteAnime = ref('')

const feedback = ref('')
const errorMessage = ref('')
const isRegisterMode = ref(false)

async function handleAuth(): Promise<void> {
  errorMessage.value = ''
  feedback.value = ''

  if (!email.value || !password.value) {
    errorMessage.value = 'Email dan password tidak boleh kosong!'
    return
  }

  let result;
  
  if (isRegisterMode.value) {
    // === VALIDASI MODE DAFTAR ===
    if (!nickname.value) {
      errorMessage.value = 'Nickname harus diisi dong!'
      return
    }
    if (password.value !== confirmPassword.value) {
      errorMessage.value = 'Password dan konfirmasi password tidak cocok!'
      return
    }

    // Panggil fungsi register dengan data tambahan
    result = await authStore.register(email.value, password.value, nickname.value, favoriteAnime.value)
    
    if (result.success) {
      feedback.value = result.message
      isRegisterMode.value = false // Otomatis pindah ke mode login
      
      // Bersihkan form setelah sukses daftar
      password.value = ''
      confirmPassword.value = ''
      nickname.value = ''
      favoriteAnime.value = ''
    } else {
      errorMessage.value = result.message
    }
  } else {
    // === MODE LOGIN ===
    result = await authStore.login(email.value, password.value)
    if (result.success) {
      feedback.value = result.message
      router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/map')
    } else {
      errorMessage.value = result.message
    }
  }
}
</script>

<template>
  <AppShell>
    <section class="auth-screen">
      <div class="auth-stack">
        <div class="section-head auth-head">
          <div>
            <p class="eyebrow">JLPT Level Up</p>
            <h1 class="title">{{ isRegisterMode ? 'Buat Akun Baru' : 'Selamat Datang Kembali' }}</h1>
            <p class="subtitle">
              {{ isRegisterMode ? 'Daftar pakai email buat nyimpen progress kamu!' : 'Masuk pakai email yang udah didaftarin.' }}
            </p>
          </div>
        </div>

        <div class="panel auth-card auth-card--wide">
          <div class="form-stack">
            
            <label class="field" v-if="isRegisterMode">
              <span>Nickname / Username</span>
              <input v-model="nickname" type="text" placeholder="Misal: Kirito99" />
            </label>

            <label class="field">
              <span>Email</span>
              <input v-model="email" type="email" placeholder="kamu@email.com" />
            </label>

            <label class="field">
              <span>Password</span>
              <input v-model="password" type="password" placeholder="minimal 6 karakter" />
            </label>

            <label class="field" v-if="isRegisterMode">
              <span>Konfirmasi Password</span>
              <input v-model="confirmPassword" type="password" placeholder="ketik ulang password di atas" />
            </label>

            <label class="field" v-if="isRegisterMode">
              <span>Anime Favorit #1 (Opsional)</span>
              <input v-model="favoriteAnime" type="text" placeholder="Misal: One Piece" />
            </label>

            <p v-if="errorMessage" class="auth-message auth-message--error" style="color: red;">{{ errorMessage }}</p>
            <p v-else-if="feedback" class="auth-message auth-message--success" style="color: green;">{{ feedback }}</p>

            <div class="button-row">
              <button class="btn btn-primary" type="button" @click="handleAuth">
                {{ isRegisterMode ? 'Daftar' : 'Login' }}
              </button>
            </div>

            <div class="auth-seed-list" style="text-align: center; margin-top: 15px; cursor: pointer;" @click="isRegisterMode = !isRegisterMode">
              <p v-if="!isRegisterMode">Belum punya akun? <strong>Daftar di sini</strong></p>
              <p v-else>Sudah punya akun? <strong>Login di sini</strong></p>
            </div>
            
          </div>
        </div>
      </div>
    </section>
  </AppShell>
</template>