<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '../components/AppShell.vue'
import { useAuthStore } from '../stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const loginId = ref('user')
const password = ref('user')
const feedback = ref('')
const errorMessage = ref('')

function handleLogin(): void {
  errorMessage.value = ''
  feedback.value = ''

  const result = authStore.login(loginId.value, password.value)

  if (!result.success) {
    errorMessage.value = result.message
    return
  }

  feedback.value = result.message
  router.push(typeof route.query.redirect === 'string' ? route.query.redirect : '/map')
}
</script>

<template>
  <AppShell>
    <section class="auth-screen">
      <div class="auth-stack">
        <div class="section-head auth-head">
          <div>
            <p class="eyebrow">tes tes, kamu jeleg wle</p>
            <h1 class="title">Mock login sementara</h1>
            <p class="subtitle">
              db nya masih lokal jdi login nya pake yang dibawah itu, have fun!
            </p>
          </div>
        </div>

        <div class="panel auth-card auth-card--wide">
          <div class="form-stack">
            <label class="field">
              <span>ID</span>
              <input v-model="loginId" type="text" placeholder="user" />
            </label>

            <label class="field">
              <span>Password</span>
              <input v-model="password" type="password" placeholder="********" />
            </label>

            <p v-if="errorMessage" class="auth-message auth-message--error">{{ errorMessage }}</p>
            <p v-else-if="feedback" class="auth-message auth-message--success">{{ feedback }}</p>

            <div class="button-row">
              <button class="btn btn-primary" type="button" @click="handleLogin">Login</button>
            </div>

            <div class="auth-seed-list">
              <!-- <div><strong>Admin</strong>: id `admin` / pw `admin`</div> -->
              <div><strong>User</strong>: id `user` / pw `user`</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  </AppShell>
</template>
