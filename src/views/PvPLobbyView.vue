<script setup lang="ts">
import { ref } from 'vue'
import { usePvpStore } from '../stores/pvp'
import { useAuthStore } from '../stores/auth'
import { watch } from 'vue'
import { useRouter } from 'vue-router'

const pvpStore = usePvpStore()
const authStore = useAuthStore()
const inviteCodeInput = ref('')

const router = useRouter()

watch(
  () => pvpStore.currentRoom?.battle_started,
  (started) => {
    if (started) {
      router.push('/pvp/arena')
    }
  }
)

const leaveLobby = () => {
  pvpStore.leaveRoom()

  router.push('/')
}

const handleCreate = async () => {
  const nickname = authStore.currentUser?.user_metadata?.nickname || 'Player'
  await pvpStore.createRoom(nickname)
}

const handleJoin = async () => {
  const nickname = authStore.currentUser?.user_metadata?.nickname || 'Player'
  await pvpStore.joinRoom(inviteCodeInput.value, nickname)
}
</script>

<template>
  <div class="pvp-lobby">
    <button class="back-btn" @click="leaveLobby">
      ← Kembali
    </button>

    <h1>⚔️ By One JLPT</h1>

    <!-- Belum masuk room -->
    <div v-if="!pvpStore.currentRoom" class="menu-card">
      <button class="main-btn" @click="handleCreate">
        Buat Room Baru
      </button>

      <div class="divider">
        <span>ATAU</span>
      </div>

      <input
        v-model="inviteCodeInput"
        placeholder="Masukkan Kode Invite"
        class="invite-input"
      />

      <button class="join-btn" @click="handleJoin">
        Join Room
      </button>
    </div>

    <!-- Sudah masuk room -->
    <div v-else class="room-card">
      <h2>Kode Room</h2>

      <div class="room-code">
        {{ pvpStore.currentRoom.invite_code }}
      </div>

      <p class="status">
        Menunggu lawan bergabung...
      </p>

      <h3>Pemain:</h3>

      <ul class="player-list">
        <li
          v-for="player in pvpStore.players"
          :key="player.id"
        >
          {{ player.player_name }}
        </li>
      </ul>

      <p v-if="pvpStore.players.length < 2">
        Share kode room ke temanmu 🔥
      </p>

      <p v-else class="starting-text">
        Battle dimulai...
      </p>
    </div>
  </div>
</template>

<style scoped>
.pvp-lobby {
  min-height: 100vh;
  padding: 40px 20px;
  background: #f5f7fb;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.back-btn {
  align-self: flex-start;
  margin-bottom: 20px;
}

h1 {
  margin-bottom: 30px;
}

.menu-card,
.room-card {
  width: 100%;
  max-width: 420px;
  background: white;
  padding: 24px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.main-btn,
.join-btn {
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-weight: bold;
}

.main-btn {
  margin-bottom: 20px;
}

.divider {
  text-align: center;
  margin: 20px 0;
}

.invite-input {
  width: 100%;
  padding: 14px;
  margin-bottom: 12px;
  border-radius: 12px;
  border: 1px solid #ccc;
}

.room-code {
  font-size: 32px;
  font-weight: bold;
  letter-spacing: 4px;
  margin: 16px 0;
}

.player-list {
  margin-top: 12px;
}

.status,
.starting-text {
  margin-top: 20px;
}
</style>