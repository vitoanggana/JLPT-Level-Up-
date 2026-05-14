<script setup lang="ts">
import { ref } from 'vue'
import { usePvpStore } from '../stores/pvp'
import { useAuthStore } from '../stores/auth'

const pvpStore = usePvpStore()
const authStore = useAuthStore()
const inviteCodeInput = ref('')

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
    <h1>PvP Arena</h1>
    
    <div v-if="!pvpStore.currentRoom">
      <button @click="handleCreate">Buat Room Baru</button>
      <hr />
      <input v-model="inviteCodeInput" placeholder="Masukkan Kode Invite" />
      <button @click="handleJoin">Join Room</button>
    </div>

    <div v-else>
  <h2>Kode Room: {{ pvpStore.currentRoom.invite_code }}</h2>

  <p>Status: {{ pvpStore.currentRoom.status }}</p>

  <h2 v-if="pvpStore.currentRoom.battle_started">
    🔥 Battle Started!
  </h2>

  <h3>Pemain di dalam:</h3>

  <ul>
    <li v-for="player in pvpStore.players" :key="player.id">
      {{ player.player_name }} - HP: {{ player.hp }}
    </li>
  </ul>

  <button
    v-if="pvpStore.players.length >= 2"
    @click="pvpStore.attackOpponent()"
  >
    SERANG LAWAN! (Test Damage)
  </button>

  <p v-else>Menunggu lawan bergabung...</p>
</div>
  </div>
</template>