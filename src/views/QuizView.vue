<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import AppShell from '../components/AppShell.vue'
import { getQuizDefinition } from '../data/quizzes'
import { jlptLevels } from '../data/levels'
import { useProgressStore } from '../stores/progress'

const route = useRoute()
const router = useRouter()
const progressStore = useProgressStore()

const quizDefinition = getQuizDefinition(route.params.levelId, route.params.categoryId)

const currentIndex = ref(0)
const answers = ref({})
const submitted = ref(false)
const submissionOutcome = ref(null)

const currentQuestion = computed(() => quizDefinition?.questions[currentIndex.value] ?? null)
const totalCards = computed(() => quizDefinition?.questions.length ?? 0)
const categoryConfig = computed(() => {
  return jlptLevels.find((level) => level.id === route.params.levelId)?.categories.find((category) => category.id === route.params.categoryId) ?? null
})
const passingCorrect = computed(() => categoryConfig.value?.passingCorrect ?? totalQuestions.value)
const passedQuiz = computed(() => correctCount.value >= passingCorrect.value)

function getQuestionKeys(question) {
  if (!question) {
    return []
  }

  if (Array.isArray(question.questionNumbers)) {
    return question.questionNumbers.map((number) => String(number))
  }

  if (question.number != null) {
    return [String(question.number)]
  }

  return [String(question.id)]
}

const totalQuestions = computed(() => {
  if (quizDefinition?.questionCount) {
    return quizDefinition.questionCount
  }

  return quizDefinition?.questions.reduce((sum, question) => sum + getQuestionKeys(question).length, 0) ?? 0
})

const answeredCount = computed(() => {
  return quizDefinition?.questions.reduce((sum, question) => {
    return sum + getQuestionKeys(question).filter((key) => answers.value[key] != null).length
  }, 0) ?? 0
})

const currentQuestionKeyList = computed(() => getQuestionKeys(currentQuestion.value))
const currentAnsweredCount = computed(() => {
  return currentQuestionKeyList.value.filter((key) => answers.value[key] != null).length
})

const currentQuestionLabel = computed(() => {
  if (!currentQuestion.value) {
    return ''
  }

  if (Array.isArray(currentQuestion.value.questionNumbers) && currentQuestion.value.questionNumbers.length > 1) {
    const first = currentQuestion.value.questionNumbers[0]
    const last = currentQuestion.value.questionNumbers[currentQuestion.value.questionNumbers.length - 1]
    return `${first}-${last}`
  }

  return String(currentQuestion.value.number ?? currentQuestion.value.id)
})

const questionInstruction = computed(() => {
  if (route.params.categoryId === 'bunpou-dokkai') {
    const section = currentQuestion.value?.section

    if (section === 'fill-blank') {
      return {
        title: 'Pilih partikel atau kalimat yang benar',
        description: 'Cari jawaban yang paling tepat untuk mengisi bagian kosong pada kalimat.',
      }
    }

    if (section === 'sentence-order') {
      return {
        title: 'Susun kata lalu cari posisi bintang',
        description: 'Rangkai kata-kata menjadi kalimat yang benar, lalu pilih kata yang harus berada di posisi bintang.',
      }
    }

    if (section === 'passage-fill') {
      return {
        title: 'Isi nomor kosong dari bacaan',
        description: 'Baca bunshou-nya dulu, lalu jawab setiap nomor yang ditandai pada paragraf.',
      }
    }

    if (section === 'reading-match') {
      return {
        title: 'Pilih bunshou yang sesuai',
        description: 'Tentukan kalimat atau bunshou yang paling cocok dengan isi paragraf.',
      }
    }

    if (section === 'reading-photo') {
      return {
        title: 'Pilih gambar yang sesuai',
        description: 'Cocokkan isi paragraf dengan foto atau ilustrasi yang paling tepat.',
      }
    }

    if (section === 'reading-letter') {
      return {
        title: 'Baca memo atau surat dengan teliti',
        description: 'Gunakan informasi pada catatan untuk memilih jawaban yang benar.',
      }
    }

    if (section === 'reading-questions') {
      return {
        title: 'Jawab pertanyaan berdasarkan cerita',
        description: 'Satu bacaan bisa punya lebih dari satu pertanyaan, jadi cek semua nomor sebelum lanjut.',
      }
    }

    if (section === 'reading-ad') {
      return {
        title: 'Gunakan foto atau iklan pendukung',
        description: 'Lihat gambar di samping atau di atas, lalu pilih jawaban yang paling sesuai.',
      }
    }
  }

  const id = Number(currentQuestion.value?.number ?? currentQuestion.value?.id ?? 0)

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
  return quizDefinition?.questions.reduce((sum, question) => {
    if (Array.isArray(question.questionNumbers)) {
      return sum + question.questionNumbers.filter((number) => {
        return answers.value[String(number)] === question.answers?.[String(number)]
      }).length
    }

    return sum + (answers.value[String(question.number ?? question.id)] === question.answer ? 1 : 0)
  }, 0) ?? 0
})

const scorePercent = computed(() => {
  if (!totalQuestions.value) {
    return 0
  }

  return Math.round((correctCount.value / totalQuestions.value) * 100)
})

function chooseAnswer(choiceNumber, targetKey = null) {
  if (!currentQuestion.value || submitted.value) {
    return
  }

  const answerKey = String(targetKey ?? currentQuestion.value.number ?? currentQuestion.value.id)

  answers.value = {
    ...answers.value,
    [answerKey]: choiceNumber,
  }
}

function goNext() {
  if (currentIndex.value < totalCards.value - 1) {
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

  submissionOutcome.value = progressStore.completeCategory(
    route.params.levelId,
    route.params.categoryId,
    scorePercent.value,
    correctCount.value,
  )
  submitted.value = true
}

function retryQuiz() {
  router.go(0)
}

function isCardAnswered(question) {
  return getQuestionKeys(question).every((key) => answers.value[key] != null)
}

function questionImages(question) {
  if (!question) {
    return []
  }

  if (Array.isArray(question.images)) {
    return question.images
  }

  if (question.image) {
    return [
      {
        src: question.image,
        alt: `Question ${question.number ?? question.id}`,
      },
    ]
  }

  return []
}
</script>

<template>
  <AppShell>
    <section v-if="quizDefinition" class="quiz-screen">
      <div class="quiz-layout" v-if="!submitted && currentQuestion">
        <div class="quiz-main panel">
          <p class="eyebrow">{{ quizDefinition.title }}</p>
          <h1 class="title" style="font-size: 38px;">Soal {{ currentQuestionLabel }}</h1>
          <p class="subtitle">{{ quizDefinition.subtitle }}</p>

          <div class="quiz-progress">
            <div class="progress-bar">
              <span :style="{ width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%` }" />
            </div>
            <p class="small-note">
              {{ answeredCount }} / {{ totalQuestions }} terjawab
              <span v-if="currentQuestionKeyList.length > 1"> • set ini {{ currentAnsweredCount }} / {{ currentQuestionKeyList.length }}</span>
            </p>
          </div>

          <div class="quiz-instruction-card">
            <p class="quiz-instruction-card__title">{{ questionInstruction.title }}</p>
            <p class="quiz-instruction-card__text">{{ questionInstruction.description }}</p>
          </div>

          <div class="quiz-question-card">
            <p class="quiz-question-card__prompt">
              {{ currentQuestion.prompt || 'Baca soal asli pada gambar, lalu pilih jawaban 1, 2, 3, atau 4.' }}
            </p>

            <div v-if="currentQuestion.type === 'text'" class="quiz-question-card__body">
              <p class="quiz-question-card__text">{{ currentQuestion.question }}</p>
            </div>

            <div v-else class="quiz-question-card__media-stack">
              <div
                v-for="(image, imageIndex) in questionImages(currentQuestion)"
                :key="`${currentQuestion.id}-${imageIndex}`"
                class="quiz-question-card__image-wrap"
              >
                <img
                  class="quiz-question-card__image"
                  :src="image.src"
                  :alt="image.alt || `Question ${currentQuestionLabel}`"
                />
              </div>
            </div>
          </div>

          <div v-if="currentQuestionKeyList.length === 1" class="quiz-choice-grid">
            <button
              v-for="(choice, index) in currentQuestion.choices ?? ['1', '2', '3', '4']"
              :key="`${currentQuestion.id}-${index}`"
              class="quiz-choice"
              :class="{ 'quiz-choice--selected': answers[currentQuestionKeyList[0]] === index + 1 }"
              type="button"
              @click="chooseAnswer(index + 1, currentQuestionKeyList[0])"
            >
              <span class="quiz-choice__number">{{ index + 1 }}</span>
              <span class="quiz-choice__text">{{ choice }}</span>
            </button>
          </div>

          <div v-else class="quiz-multi-answer-list">
            <div
              v-for="questionNumber in currentQuestion.questionNumbers"
              :key="`${currentQuestion.id}-${questionNumber}`"
              class="quiz-multi-answer-card"
            >
              <div class="quiz-multi-answer-card__head">
                <strong>Soal {{ questionNumber }}</strong>
                <span class="small-note">
                  {{ answers[String(questionNumber)] ? `Jawaban ${answers[String(questionNumber)]}` : 'Belum dijawab' }}
                </span>
              </div>

              <div class="quiz-multi-answer-card__choices">
                <button
                  v-for="choiceNumber in 4"
                  :key="`${questionNumber}-${choiceNumber}`"
                  class="quiz-micro-choice"
                  :class="{ 'quiz-micro-choice--selected': answers[String(questionNumber)] === choiceNumber }"
                  type="button"
                  @click="chooseAnswer(choiceNumber, questionNumber)"
                >
                  {{ choiceNumber }}
                </button>
              </div>
            </div>
          </div>

          <div class="button-row" style="margin-top: 24px;">
            <button class="btn btn-secondary" type="button" :disabled="currentIndex === 0" @click="goPrevious">
              Sebelumnya
            </button>
            <button
              class="btn btn-secondary"
              type="button"
              :disabled="currentIndex === totalCards - 1"
              @click="goNext"
            >
              Berikutnya
            </button>
            <button
              class="btn btn-primary"
              type="button"
              :disabled="answeredCount !== totalQuestions"
              @click="submitQuiz"
            >
              Selesaikan Quiz
            </button>
          </div>
        </div>

        <aside class="quiz-sidebar panel">
          <p class="eyebrow">Peta Soal</p>
          <div class="quiz-index-grid">
            <button
              v-for="(question, index) in quizDefinition.questions"
              :key="question.id"
              class="quiz-index-pill"
              :class="{
                'quiz-index-pill--active': index === currentIndex,
                'quiz-index-pill--done': isCardAnswered(question),
              }"
              type="button"
              @click="currentIndex = index"
            >
              {{ index + 1 }}
            </button>
          </div>

          <div class="milestone-list" style="margin-top: 18px;">
            <div>Kartu di sesi ini: {{ totalCards }}</div>
            <div>Soal yang dinilai: {{ totalQuestions }}</div>
            <div>Level: {{ route.params.levelId.toUpperCase() }}</div>
          </div>
        </aside>
      </div>

      <div v-else class="quiz-result panel">
        <p class="eyebrow">Hasil Quiz</p>
        <h1 class="title">Nilai {{ scorePercent }}%</h1>
        <p class="subtitle">
          Kamu menjawab benar {{ correctCount }} dari {{ totalQuestions }} soal.
        </p>
        <p class="small-note" style="margin-top: 12px;">
          Minimum kelulusan: {{ passingCorrect }} / {{ totalQuestions }} benar.
          {{ passedQuiz ? 'Stage clear, node berikutnya terbuka jika ada.' : 'Belum lulus, jadi stage berikutnya belum terbuka.' }}
        </p>

        <div class="stats-row" style="margin-top: 24px;">
          <div class="stat-card">
            Benar
            <strong>{{ correctCount }}</strong>
          </div>
          <div class="stat-card">
            Salah
            <strong>{{ totalQuestions - correctCount }}</strong>
          </div>
          <div class="stat-card">
            Status
            <strong>{{ passedQuiz ? 'Lulus' : 'Ulangi' }}</strong>
          </div>
        </div>

        <div class="button-row" style="margin-top: 24px;">
          <button class="btn btn-primary" type="button" @click="router.push(`/island/${route.params.levelId}`)">
            Kembali ke Pulau
          </button>
          <button class="btn btn-secondary" type="button" @click="retryQuiz">
            Ulangi Set Acak
          </button>
        </div>
      </div>
    </section>

    <section v-else class="quiz-screen">
      <div class="panel empty-state">
        <h1>Quiz belum tersedia</h1>
        <p class="small-note">Bank soal untuk route ini belum terhubung ke quiz flow.</p>
        <div class="button-row" style="justify-content: center; margin-top: 20px;">
          <button class="btn btn-primary" type="button" @click="router.push(`/island/${route.params.levelId}`)">
            Kembali ke Pulau
          </button>
        </div>
      </div>
    </section>
  </AppShell>
</template>
