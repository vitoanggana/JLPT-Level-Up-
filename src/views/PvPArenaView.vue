<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { usePvpStore } from '../stores/pvp'
import { useAuthStore } from '../stores/auth'

const pvpStore = usePvpStore()
const authStore = useAuthStore()
const router = useRouter()

const myPlayer = computed(() =>
  pvpStore.players.find(
    p => p.user_id === authStore.currentUser?.id
  )
)

const enemyPlayer = computed(() =>
  pvpStore.players.find(
    p => p.user_id !== authStore.currentUser?.id
  )
)

const leaveArena = () => {
  pvpStore.leaveRoom()
  router.push('/pvp')
}
</script>

<template>
  <div class="arena-page">
    <!-- Header -->
    <div class="arena-header">
      <h1>⚔️ JLPT Battle Arena</h1>

      <button class="leave-btn" @click="leaveArena">
        Keluar
      </button>
    </div>

    <!-- Players -->
    <div class="players-section">
      <!-- Player -->
      <div class="player-card">
        <h2>
          {{ myPlayer?.player_name }}
        </h2>

        <div class="hp-bar-wrapper">
          <div
            class="hp-bar"
            :style="{
              width: `${myPlayer?.hp || 0}%`
            }"
          />
        </div>

        <p>{{ myPlayer?.hp }} HP</p>
      </div>

      <!-- VS -->
      <div class="vs-text">
        VS
      </div>

      <!-- Enemy -->
      <div class="player-card enemy">
        <h2>
          {{ enemyPlayer?.player_name || 'Waiting...' }}
        </h2>

        <div class="hp-bar-wrapper">
          <div
            class="hp-bar enemy-bar"
            :style="{
              width: `${enemyPlayer?.hp || 0}%`
            }"
          />
        </div>

        <p>{{ enemyPlayer?.hp || 0 }} HP</p>
      </div>
    </div>

    <!-- Question -->
<div class="question-card">
  <p class="question-label">
    QUESTION
  </p>

  <p
    v-if="
      pvpStore.currentQuestion?.prompt &&
      pvpStore.currentQuestion.prompt !==
        'Answer from the original quiz image.'
    "
  >
    {{ pvpStore.currentQuestion.prompt }}
  </p>

  <!-- Image -->
  <img
    v-if="pvpStore.currentQuestion?.image"
    :src="pvpStore.currentQuestion.image"
    class="question-image"
  />

  <!-- Audio -->
  <audio
    v-if="pvpStore.currentQuestion?.audio"
    controls
    class="audio-player"
  >
    <source
      :src="pvpStore.currentQuestion.audio"
    />
  </audio>
</div>

    <!-- Choices -->
<div class="choices-grid">
  <button
    class="choice-btn"
    @click="pvpStore.submitAnswer(1)"
  >
    1
  </button>

  <button
    class="choice-btn"
    @click="pvpStore.submitAnswer(2)"
  >
    2
  </button>

  <button
    class="choice-btn"
    @click="pvpStore.submitAnswer(3)"
  >
    3
  </button>

  <button
    class="choice-btn"
    @click="pvpStore.submitAnswer(4)"
  >
    4
  </button>
</div>


  </div>
</template>

<style scoped>
.arena-page {
  min-height: 100vh;
  background: #f4f7fb;
  padding: 24px;
}

.arena-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
}

.leave-btn {
  border: none;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
}

.players-section {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 20px;
  align-items: center;
  margin-bottom: 40px;
}

.player-card {
  background: white;
  padding: 20px;
  border-radius: 20px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.vs-text {
  font-size: 32px;
  font-weight: bold;
}

.hp-bar-wrapper {
  width: 100%;
  height: 20px;
  background: #ddd;
  border-radius: 999px;
  overflow: hidden;
  margin: 12px 0;
}

.hp-bar {
  height: 100%;
  background: #4ade80;
  transition: width 0.3s ease;
}

.enemy-bar {
  background: #f87171;
}

.question-card {
  background: white;
  padding: 30px;
  border-radius: 20px;
  text-align: center;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.question-image {
  width: 100%;
  max-width: 600px;
  border-radius: 16px;
  margin-top: 20px;
}

.question-label {
  font-size: 14px;
  opacity: 0.7;
  margin-bottom: 10px;
}

.choices-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.choice-btn {
  padding: 18px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  background: white;
  font-size: 16px;
  font-weight: bold;
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  transition: 0.2s ease;
}

.choice-btn:hover {
  transform: translateY(-2px);
}

.audio-player {
  width: 100%;
  margin-top: 20px;
}

.correct {
  border: 2px solid #4ade80;
}

@media (max-width: 768px) {
  .players-section {
    grid-template-columns: 1fr;
  }

  .vs-text {
    text-align: center;
  }

  .choices-grid {
    grid-template-columns: 1fr;
  }
}
</style>