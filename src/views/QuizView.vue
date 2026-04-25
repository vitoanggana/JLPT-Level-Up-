<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '../components/AppShell.vue'
import { getQuizDefinition } from '../data/quizzes'
import { useProgressStore } from '../stores/progress'

const route = useRoute()
const router = useRouter()
const progressStore = useProgressStore()

const quizDefinition = getQuizDefinition(route.params.levelId, route.params.categoryId)

const currentIndex = ref(0)
const answers = ref({})
const submitted = ref(false)

const currentQuestion = computed(() => quizDefinition?.questions[currentIndex.value] ?? null)
const totalQuestions = computed(() => quizDefinition?.questions.length ?? 0)
const answeredCount = computed(() => Object.keys(answers.value).length)

const questionInstruction = computed(() => {
  const id = currentQuestion.value?.id ?? 0

  if (id >= 1 && id <= 10) {
    return {
      title: 'Cari cara baca kanji yang benar',
      description: 'Pilih jawaban yang menunjukkan bacaan hiragana yang tepat untuk kata berkanji pada soal.',
    }
  }

  if (id >= 11 && id <= 18) {
    return {
      title: 'Cari kanji yang benar dari hiragananya',
      description: 'Pilih pilihan yang menulis kata hiragana pada soal dengan bentuk kanji yang benar.',
    }
  }

  if (id >= 19 && id <= 28) {
    return {
      title: 'Pilih kotoba yang tepat untuk melengkapi kalimat',
      description: 'Cari kata yang paling pas untuk mengisi bagian kosong agar kalimatnya jadi benar.',
    }
  }

  if (id >= 29 && id <= 33) {
    return {
      title: 'Cari kalimat yang maknanya sama',
      description: 'Pilih kalimat yang menyatakan arti paling dekat atau sama dengan kalimat pada soal.',
    }
  }

  return {
    title: 'Pilih jawaban yang paling tepat',
    description: 'Baca soal dengan teliti lalu pilih satu jawaban terbaik.',
  }
})

const correctCount = computed(() => {
  return quizDefinition?.questions.filter((question) => {
    return answers.value[question.id] === question.answer
  }).length ?? 0
})

const scorePercent = computed(() => {
  if (!totalQuestions.value) {
    return 0
  }

  return Math.round((correctCount.value / totalQuestions.value) * 100)
})

function chooseAnswer(choiceNumber) {
  if (!currentQuestion.value || submitted.value) {
    return
  }

  answers.value = {
    ...answers.value,
    [currentQuestion.value.id]: choiceNumber,
  }
}

function goNext() {
  if (currentIndex.value < totalQuestions.value - 1) {
    currentIndex.value += 1
  }
}

function goPrevious() {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1
  }
}

function submitQuiz() {
  if (!quizDefinition || answeredCount.value !== totalQuestions.value) {
    return
  }

  progressStore.completeCategory(route.params.levelId, route.params.categoryId, scorePercent.value)
  submitted.value = true
}

function retryQuiz() {
  router.go(0)
}
</script>

<template>
  <AppShell>
    <section v-if="quizDefinition" class="quiz-screen">
      <div class="quiz-layout" v-if="!submitted && currentQuestion">
        <div class="quiz-main panel">
          <p class="eyebrow">{{ quizDefinition.title }}</p>
          <h1 class="title" style="font-size: 38px;">Question {{ currentIndex + 1 }}</h1>
          <p class="subtitle">{{ quizDefinition.subtitle }}</p>

          <div class="quiz-progress">
            <div class="progress-bar">
              <span :style="{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }" />
            </div>
            <p class="small-note">{{ answeredCount }} / {{ totalQuestions }} answered</p>
          </div>

          <div class="quiz-instruction-card">
            <p class="quiz-instruction-card__title">{{ questionInstruction.title }}</p>
            <p class="quiz-instruction-card__text">{{ questionInstruction.description }}</p>
          </div>

          <div class="quiz-question-card">
            <p class="quiz-question-card__prompt">
              Baca soal asli pada gambar, lalu pilih jawaban 1, 2, 3, atau 4.
            </p>

            <div v-if="currentQuestion.type === 'text'" class="quiz-question-card__body">
              <p class="quiz-question-card__text">{{ currentQuestion.question }}</p>
            </div>

            <div v-else class="quiz-question-card__image-wrap">
              <img
                class="quiz-question-card__image"
                :src="currentQuestion.image"
                :alt="`Question ${currentQuestion.id}`"
              />
            </div>
          </div>

          <div class="quiz-choice-grid">
            <button
              v-for="(choice, index) in currentQuestion.choices ?? ['1', '2', '3', '4']"
              :key="`${currentQuestion.id}-${index}`"
              class="quiz-choice"
              :class="{ 'quiz-choice--selected': answers[currentQuestion.id] === index + 1 }"
              type="button"
              @click="chooseAnswer(index + 1)"
            >
              <span class="quiz-choice__number">{{ index + 1 }}</span>
              <span class="quiz-choice__text">{{ choice }}</span>
            </button>
          </div>

          <div class="button-row" style="margin-top: 24px;">
            <button class="btn btn-secondary" type="button" :disabled="currentIndex === 0" @click="goPrevious">
              Previous
            </button>
            <button
              class="btn btn-secondary"
              type="button"
              :disabled="currentIndex === totalQuestions - 1"
              @click="goNext"
            >
              Next
            </button>
            <button
              class="btn btn-primary"
              type="button"
              :disabled="answeredCount !== totalQuestions"
              @click="submitQuiz"
            >
              Finish Quiz
            </button>
          </div>
        </div>

        <aside class="quiz-sidebar panel">
          <p class="eyebrow">Question Map</p>
          <div class="quiz-index-grid">
            <button
              v-for="(question, index) in quizDefinition.questions"
              :key="question.id"
              class="quiz-index-pill"
              :class="{
                'quiz-index-pill--active': index === currentIndex,
                'quiz-index-pill--done': answers[question.id],
              }"
              type="button"
              @click="currentIndex = index"
            >
              {{ index + 1 }}
            </button>
          </div>

          <div class="milestone-list" style="margin-top: 18px;">
            <div>Pool size: 33 questions</div>
            <div>Live run: 20 random questions</div>
            <div>Level: {{ route.params.levelId.toUpperCase() }}</div>
          </div>
        </aside>
      </div>

      <div v-else class="quiz-result panel">
        <p class="eyebrow">Quiz Result</p>
        <h1 class="title">Score {{ scorePercent }}%</h1>
        <p class="subtitle">
          You answered {{ correctCount }} out of {{ totalQuestions }} questions correctly.
        </p>

        <div class="stats-row" style="margin-top: 24px;">
          <div class="stat-card">
            Correct
            <strong>{{ correctCount }}</strong>
          </div>
          <div class="stat-card">
            Wrong
            <strong>{{ totalQuestions - correctCount }}</strong>
          </div>
          <div class="stat-card">
            Saved
            <strong>Done</strong>
          </div>
        </div>

        <div class="button-row" style="margin-top: 24px;">
          <button class="btn btn-primary" type="button" @click="router.push(`/island/${route.params.levelId}`)">
            Back to Island
          </button>
          <button class="btn btn-secondary" type="button" @click="retryQuiz">
            Retry Random Set
          </button>
        </div>
      </div>
    </section>

    <section v-else class="quiz-screen">
      <div class="panel empty-state">
        <h1>Quiz belum tersedia</h1>
        <p class="small-note">Saat ini baru N5 Moji Goi yang sudah terhubung ke bank soal.</p>
        <div class="button-row" style="justify-content: center; margin-top: 20px;">
          <button class="btn btn-primary" type="button" @click="router.push(`/island/${route.params.levelId}`)">
            Back to Island
          </button>
        </div>
      </div>
    </section>
  </AppShell>
</template>
