<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'

import AppShell from '../components/AppShell.vue'
import { getQuizDefinition } from '../data/quizzes'
import { jlptLevels } from '../data/levels'
import { useProgressStore } from '../stores/progress'
import type {
  CategoryConfig,
  CategoryId,
  CompleteCategoryResult,
  LevelId,
  MultiAnswerQuestion,
  QuizDefinition,
  QuizImage,
  QuizIntroExample,
  QuizQuestion,
  QuizSubQuestion,
} from '../types'

const route = useRoute()
const router = useRouter()
const progressStore = useProgressStore()
const levelId = computed(() => route.params.levelId as LevelId)
const categoryId = computed(() => route.params.categoryId as CategoryId)

const quizDefinition = computed<QuizDefinition | null>(() => getQuizDefinition(levelId.value, categoryId.value))

const currentIndex = ref(0)
const answers = ref<Record<string, number>>({})
const submitted = ref(false)
const submissionOutcome = ref<CompleteCategoryResult | null>(null)
const allowRouteLeave = ref(false)
const introChoice = ref<number | null>(null)
const introCompleted = ref(false)
const introPlayCount = ref(0)
const isIntroAudioPlaying = ref(false)
const introAudioRef = ref<HTMLAudioElement | null>(null)
const questionAudioPlayCount = ref<Record<string, number>>({})
const activeQuestionAudioKey = ref<string | null>(null)
const questionAudioRefs = ref<Record<string, HTMLAudioElement | null>>({})
const remainingSeconds = ref(0)
let timerId: number | null = null

const currentQuestion = computed<QuizQuestion | null>(() => quizDefinition.value?.questions[currentIndex.value] ?? null)
const totalCards = computed(() => quizDefinition.value?.questions.length ?? 0)
const introExample = computed<QuizIntroExample | null>(() => quizDefinition.value?.introExample ?? null)
const showIntroExample = computed(() => Boolean(introExample.value) && !introCompleted.value)
const categoryConfig = computed<CategoryConfig | null>(() => {
  return jlptLevels.find((level) => level.id === levelId.value)?.categories.find((category) => category.id === categoryId.value) ?? null
})
const totalQuestions = computed(() => {
  if (quizDefinition.value?.questionCount) {
    return quizDefinition.value.questionCount
  }

  return quizDefinition.value?.questions.reduce((sum, question) => sum + getQuestionKeys(question).length, 0) ?? 0
})
const passingCorrect = computed(() => {
  return Math.min(categoryConfig.value?.passingCorrect ?? totalQuestions.value, totalQuestions.value)
})
const passedQuiz = computed(() => correctCount.value >= passingCorrect.value)
const quizDurationSeconds = computed(() => {
  if (categoryId.value === 'moji-goi') {
    return 30 * 60
  }

  if (categoryId.value === 'bunpou-dokkai') {
    return 45 * 60
  }

  if (categoryId.value === 'choukai') {
    return 60 * 60
  }

  if (categoryId.value === 'exam') {
    return 60 * 60
  }

  return 0
})

function isMultiAnswerQuestion(question: QuizQuestion | null): question is MultiAnswerQuestion {
  return Boolean(question && 'questionNumbers' in question && Array.isArray(question.questionNumbers))
}

function hasSubQuestions(question: QuizQuestion | null): question is MultiAnswerQuestion & { subQuestions: QuizSubQuestion[] } {
  return Boolean(isMultiAnswerQuestion(question) && Array.isArray(question.subQuestions) && question.subQuestions.length)
}

function getQuestionKeys(question: QuizQuestion | null): string[] {
  if (!question) {
    return []
  }

  if (isMultiAnswerQuestion(question)) {
    return question.questionNumbers.map((number) => getAnswerKey(question, number))
  }

  return [getAnswerKey(question)]
}

function getQuestionCategory(question: QuizQuestion | null): CategoryId {
  return question?.categoryId ?? categoryId.value
}

function getCategoryLabel(targetCategoryId: CategoryId): string {
  if (targetCategoryId === 'moji-goi') {
    return 'Moji Goi'
  }

  if (targetCategoryId === 'bunpou-dokkai') {
    return 'Bunpou-Dokkai'
  }

  if (targetCategoryId === 'choukai') {
    return 'Choukai'
  }

  return 'Exam'
}

function getAnswerKey(question: QuizQuestion | null, targetKey: string | number | null = null): string {
  if (!question) {
    return String(targetKey ?? '')
  }

  const keyValue = targetKey ?? question.number ?? question.id
  return `${getQuestionCategory(question)}:${String(keyValue)}`
}

const answeredCount = computed(() => {
  return quizDefinition.value?.questions.reduce((sum, question) => {
    return sum + getQuestionKeys(question).filter((key) => answers.value[key] != null).length
  }, 0) ?? 0
})

const currentQuestionKeyList = computed(() => getQuestionKeys(currentQuestion.value))
const currentAnsweredCount = computed(() => {
  return currentQuestionKeyList.value.filter((key) => answers.value[key] != null).length
})
const currentQuestionNumbers = computed(() => {
  return isMultiAnswerQuestion(currentQuestion.value) ? currentQuestion.value.questionNumbers : []
})
const currentSubQuestions = computed(() => {
  return hasSubQuestions(currentQuestion.value) ? currentQuestion.value.subQuestions : []
})

const currentQuestionLabel = computed(() => {
  if (!currentQuestion.value) {
    return ''
  }

  const prefix = categoryId.value === 'exam' ? `${getCategoryLabel(getQuestionCategory(currentQuestion.value))} ` : ''

  if (isMultiAnswerQuestion(currentQuestion.value) && currentQuestion.value.questionNumbers.length > 1) {
    const first = currentQuestion.value.questionNumbers[0]
    const last = currentQuestion.value.questionNumbers[currentQuestion.value.questionNumbers.length - 1]
    return `${prefix}${first}-${last}`
  }

  return `${prefix}${String(currentQuestion.value.number ?? currentQuestion.value.id)}`
})

const questionInstruction = computed(() => {
  const questionCategory = getQuestionCategory(currentQuestion.value)

  if (questionCategory === 'choukai') {
    return {
      title: 'Dengarkan audio lalu pilih gambar yang benar',
      description: 'Tiap audio hanya bisa diputar maksimal 2 kali. Kamu boleh langsung menjawab dan lanjut, tetapi peta soal terkunci selama audio aktif.',
    }
  }

  if (questionCategory === 'bunpou-dokkai') {
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
  return quizDefinition.value?.questions.reduce((sum, question) => {
    if (isMultiAnswerQuestion(question)) {
      return sum + question.questionNumbers.filter((number) => {
        return answers.value[getAnswerKey(question, number)] === question.answers?.[String(number)]
      }).length
    }

    return sum + (answers.value[getAnswerKey(question)] === question.answer ? 1 : 0)
  }, 0) ?? 0
})

const scorePercent = computed(() => {
  if (!totalQuestions.value) {
    return 0
  }

  return Math.round((correctCount.value / totalQuestions.value) * 100)
})

const incorrectQuestionSummaries = computed(() => {
  if (!quizDefinition.value) {
    return []
  }

  return quizDefinition.value.questions.flatMap((question) => {
    if (isMultiAnswerQuestion(question)) {
      return question.questionNumbers
        .filter((number) => answers.value[getAnswerKey(question, number)] !== question.answers?.[String(number)])
        .map((number) => ({
          key: `${String(question.id)}-${number}`,
          label: categoryId.value === 'exam' ? `${getCategoryLabel(getQuestionCategory(question))} ${number}` : `Soal ${number}`,
          userAnswer: answers.value[getAnswerKey(question, number)] ?? null,
        }))
    }

    const questionKey = getAnswerKey(question)
    if (answers.value[questionKey] === question.answer) {
      return []
    }

    return [
      {
        key: String(question.id),
        label: categoryId.value === 'exam'
          ? `${getCategoryLabel(getQuestionCategory(question))} ${question.number ?? question.id}`
          : `Soal ${question.number ?? question.id}`,
        userAnswer: answers.value[questionKey] ?? null,
      },
    ]
  })
})

const remainingIntroPlays = computed(() => Math.max(0, 2 - introPlayCount.value))
const currentQuestionAudioKey = computed(() => {
  if (!currentQuestion.value) {
    return ''
  }

  return getAnswerKey(currentQuestion.value)
})
const currentQuestionAudioPlays = computed(() => {
  if (!currentQuestionAudioKey.value) {
    return 0
  }

  return questionAudioPlayCount.value[currentQuestionAudioKey.value] ?? 0
})
const remainingQuestionAudioPlays = computed(() => Math.max(0, 2 - currentQuestionAudioPlays.value))
const isQuestionMapLocked = computed(() => getQuestionCategory(currentQuestion.value) === 'choukai' && activeQuestionAudioKey.value != null)
const formattedRemainingTime = computed(() => {
  const minutes = Math.floor(remainingSeconds.value / 60)
  const seconds = remainingSeconds.value % 60

  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
})

function handleBeforeUnload(event: BeforeUnloadEvent): string | void {
  if (allowRouteLeave.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
  return ''
}

function chooseAnswer(choiceNumber: number, targetKey: string | number | null = null): void {
  if (!currentQuestion.value || submitted.value) {
    return
  }

  const answerKey = getAnswerKey(currentQuestion.value, targetKey)

  answers.value = {
    ...answers.value,
    [answerKey]: choiceNumber,
  }
}

function stopTimer(): void {
  if (timerId != null) {
    window.clearInterval(timerId)
    timerId = null
  }
}

function setQuestionAudioRef(audioKey: string, element: HTMLAudioElement | null): void {
  if (questionAudioRefs.value[audioKey] === element) {
    return
  }


  questionAudioRefs.value[audioKey] = element
}

function getRemainingQuestionAudioPlays(audioKey: string): number {
  return Math.max(0, 2 - (questionAudioPlayCount.value[audioKey] ?? 0))
}

function stopActiveQuestionAudio(): void {
  if (!activeQuestionAudioKey.value) {
    return
  }

  const activeAudio = questionAudioRefs.value[activeQuestionAudioKey.value]
  activeAudio?.pause()

  if (activeAudio) {
    activeAudio.currentTime = 0
  }

  activeQuestionAudioKey.value = null
}

function finalizeQuiz(): void {
  if (submitted.value || !quizDefinition.value) {
    return
  }

  stopTimer()
  stopActiveQuestionAudio()
  submissionOutcome.value = progressStore.completeCategory(
    levelId.value,
    categoryId.value,
    scorePercent.value,
    correctCount.value,
  )
  submitted.value = true
  allowRouteLeave.value = true
}

async function playIntroAudio(): Promise<void> {
  if (!introAudioRef.value || isIntroAudioPlaying.value || remainingIntroPlays.value <= 0) {
    return
  }

  try {
    introPlayCount.value += 1
    isIntroAudioPlaying.value = true
    introAudioRef.value.currentTime = 0
    await introAudioRef.value.play()
  } catch {
    introPlayCount.value = Math.max(0, introPlayCount.value - 1)
    isIntroAudioPlaying.value = false
  }
}

async function playQuestionAudioByKey(audioKey: string): Promise<void> {
  const audioElement = questionAudioRefs.value[audioKey]

  if (!audioElement || getRemainingQuestionAudioPlays(audioKey) <= 0) {
    return
  }

  if (activeQuestionAudioKey.value && activeQuestionAudioKey.value !== audioKey) {
    stopActiveQuestionAudio()
  }

  if (activeQuestionAudioKey.value === audioKey) {
    return
  }

  const previousPlayCount = questionAudioPlayCount.value[audioKey] ?? 0

  try {
    questionAudioPlayCount.value = {
      ...questionAudioPlayCount.value,
      [audioKey]: previousPlayCount + 1,
    }
    activeQuestionAudioKey.value = audioKey
    audioElement.currentTime = 0
    await audioElement.play()
  } catch {
    questionAudioPlayCount.value = {
      ...questionAudioPlayCount.value,
      [audioKey]: previousPlayCount,
    }
    activeQuestionAudioKey.value = null
  }
}

function handleIntroAudioEnded(): void {
  isIntroAudioPlaying.value = false
}

function handleQuestionAudioEnded(audioKey: string): void {
  if (activeQuestionAudioKey.value === audioKey) {
    activeQuestionAudioKey.value = null
  }
}

function chooseIntroAnswer(choiceNumber: number): void {
  introChoice.value = choiceNumber
}

function continueFromIntro(): void {
  if (!introChoice.value) {
    return
  }

  if (introAudioRef.value) {
    introAudioRef.value.pause()
    introAudioRef.value.currentTime = 0
  }

  isIntroAudioPlaying.value = false
  introCompleted.value = true
}

function goNext(): void {
  stopActiveQuestionAudio()

  if (currentIndex.value < totalCards.value - 1) {
    currentIndex.value += 1
  }
}

function goPrevious(): void {
  stopActiveQuestionAudio()

  if (currentIndex.value > 0) {
    currentIndex.value -= 1
  }
}

function submitQuiz(): void {
  if (!quizDefinition.value || answeredCount.value !== totalQuestions.value) {
    return
  }

  finalizeQuiz()
}

function retryQuiz(): void {
  allowRouteLeave.value = true
  router.go(0)
}

function exitQuiz(): void {
  allowRouteLeave.value = true
  stopTimer()
  stopActiveQuestionAudio()

  if (introAudioRef.value) {
    introAudioRef.value.pause()
    introAudioRef.value.currentTime = 0
  }

  router.push(`/island/${levelId.value}`)
}

function jumpToQuestion(index: number): void {
  if (isQuestionMapLocked.value) {
    return
  }

  stopActiveQuestionAudio()
  currentIndex.value = index
}

function isCardAnswered(question: QuizQuestion): boolean {
  return getQuestionKeys(question).every((key) => answers.value[key] != null)
}

function questionImages(question: QuizQuestion | null): QuizImage[] {
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

onBeforeUnmount(() => {
  stopTimer()
  window.removeEventListener('beforeunload', handleBeforeUnload)

  if (introAudioRef.value) {
    introAudioRef.value.pause()
    introAudioRef.value.currentTime = 0
  }

  for (const audioElement of Object.values(questionAudioRefs.value)) {
    audioElement?.pause()
    if (audioElement) {
      audioElement.currentTime = 0
    }
  }
})

onMounted(() => {
  window.addEventListener('beforeunload', handleBeforeUnload)
  remainingSeconds.value = quizDurationSeconds.value

  if (!quizDurationSeconds.value) {
    return
  }

  timerId = window.setInterval(() => {
    if (remainingSeconds.value <= 1) {
      remainingSeconds.value = 0
      finalizeQuiz()
      return
    }

    remainingSeconds.value -= 1
  }, 1000)
})

onBeforeRouteLeave(() => {
  if (allowRouteLeave.value) {
    return true
  }

  return false
})
</script>

<template>
  <AppShell>
    <section v-if="quizDefinition" class="quiz-screen">
      <div v-if="showIntroExample" class="quiz-layout">
        <div class="quiz-main panel">
          <p class="eyebrow">{{ quizDefinition.title }}</p>
          <h1 class="title" style="font-size: 38px;">{{ introExample?.title }}</h1>
          <p class="subtitle">{{ introExample?.description }}</p>

          <div class="quiz-timer-card">
            <span class="quiz-timer-card__label">Sisa Waktu</span>
            <strong class="quiz-timer-card__value">{{ formattedRemainingTime }}</strong>
          </div>

          <div class="quiz-instruction-card" style="margin-top: 24px;">
            <p class="quiz-instruction-card__title">Dengarkan contoh terlebih dahulu</p>
            <p class="quiz-instruction-card__text">
              {{ introExample?.prompt }}
            </p>
          </div>

          <div class="quiz-audio-panel">
            <audio
              ref="introAudioRef"
              :src="introExample?.audioSrc"
              preload="auto"
              @ended="handleIntroAudioEnded"
              @pause="handleIntroAudioEnded"
            />
            <button
              class="btn btn-primary"
              type="button"
              :disabled="isIntroAudioPlaying || remainingIntroPlays === 0"
              @click="playIntroAudio"
            >
              {{ isIntroAudioPlaying ? 'Audio sedang diputar' : 'Putar Audio Rei' }}
            </button>
            <p class="small-note">
              Sisa putar: {{ remainingIntroPlays }} dari 2
            </p>
          </div>

          <div class="quiz-question-card">
            <p class="quiz-question-card__prompt">Perhatikan gambar contoh berikut.</p>

            <div class="quiz-question-card__media-stack">
              <div class="quiz-question-card__image-wrap">
                <img
                  class="quiz-question-card__image"
                  :src="introExample?.imageSrc"
                  :alt="introExample?.imageAlt"
                />
              </div>
            </div>
          </div>

          <div class="quiz-choice-grid">
            <button
              v-for="(choice, index) in introExample?.choices ?? []"
              :key="`intro-${index}`"
              class="quiz-choice"
              :class="{ 'quiz-choice--selected': introChoice === index + 1 }"
              type="button"
              @click="chooseIntroAnswer(index + 1)"
            >
              <span class="quiz-choice__number">{{ index + 1 }}</span>
              <span class="quiz-choice__text">{{ choice }}</span>
            </button>
          </div>

          <div class="button-row" style="margin-top: 24px;">
            <button class="btn btn-secondary" type="button" @click="exitQuiz">
              Keluar
            </button>
            <button class="btn btn-primary" type="button" :disabled="!introChoice" @click="continueFromIntro">
              Lanjut ke Soal Utama
            </button>
          </div>
        </div>

        <aside class="quiz-sidebar panel">
          <p class="eyebrow">Info Rei</p>
          <div class="milestone-list">
            <div>Bagian ini adalah contoh sebelum blok pertama choukai dimulai.</div>
            <div>Audio contoh hanya bisa diputar maksimal 2 kali.</div>
            <div>Pilih satu jawaban agar tombol lanjut terbuka.</div>
          </div>
        </aside>
      </div>

      <div class="quiz-layout" v-else-if="!submitted && currentQuestion">
        <div class="quiz-main panel">
          <p class="eyebrow">{{ quizDefinition.title }}</p>
          <h1 class="title" style="font-size: 38px;">Soal {{ currentQuestionLabel }}</h1>
          <p class="subtitle">{{ quizDefinition.subtitle }}</p>

          <div class="quiz-timer-card">
            <span class="quiz-timer-card__label">Sisa Waktu</span>
            <strong class="quiz-timer-card__value">{{ formattedRemainingTime }}</strong>
          </div>

          <div class="quiz-progress">
            <div class="progress-bar">
              <span :style="{ width: `${totalQuestions ? (answeredCount / totalQuestions) * 100 : 0}%` }" />
            </div>
            <p class="small-note">
              {{ answeredCount }} / {{ totalQuestions }} terjawab
              <span v-if="currentQuestionKeyList.length > 1"> | set ini {{ currentAnsweredCount }} / {{ currentQuestionKeyList.length }}</span>
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

            <div v-if="currentQuestion.audio" class="quiz-audio-panel" style="margin-top: 0; margin-bottom: 16px;">
              <audio
                :ref="(element) => setQuestionAudioRef(currentQuestionAudioKey, element as HTMLAudioElement | null)"
                :src="currentQuestion.audio"
                preload="auto"
                @ended="handleQuestionAudioEnded(currentQuestionAudioKey)"
                @pause="handleQuestionAudioEnded(currentQuestionAudioKey)"
              />
              <button
                class="btn btn-primary"
                type="button"
                :disabled="activeQuestionAudioKey === currentQuestionAudioKey || remainingQuestionAudioPlays === 0"
                @click="playQuestionAudioByKey(currentQuestionAudioKey)"
              >
                {{ activeQuestionAudioKey === currentQuestionAudioKey ? 'Audio sedang diputar' : 'Putar Audio Soal' }}
              </button>
              <p class="small-note">
                Sisa putar audio soal ini: {{ remainingQuestionAudioPlays }} dari 2
              </p>
            </div>

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
              @click="chooseAnswer(index + 1)"
            >
              <span class="quiz-choice__number">{{ index + 1 }}</span>
              <span class="quiz-choice__text">{{ choice }}</span>
            </button>
          </div>

          <div v-else class="quiz-multi-answer-list">
            <template v-if="currentSubQuestions.length">
              <div
                v-for="subQuestion in currentSubQuestions"
                :key="`${currentQuestion.id}-${subQuestion.number}`"
                class="quiz-multi-answer-card"
              >
                <div class="quiz-multi-answer-card__head">
                  <strong>Soal {{ subQuestion.number }}</strong>
                  <span class="small-note">
                    {{ answers[getAnswerKey(currentQuestion, subQuestion.number)] ? `Jawaban ${answers[getAnswerKey(currentQuestion, subQuestion.number)]}` : 'Belum dijawab' }}
                  </span>
                </div>

                <div class="quiz-audio-panel" style="margin-top: 14px;">
                  <audio
                    :ref="(element) => setQuestionAudioRef(getAnswerKey(currentQuestion, subQuestion.number), element as HTMLAudioElement | null)"
                    :src="subQuestion.audio"
                    preload="auto"
                    @ended="handleQuestionAudioEnded(getAnswerKey(currentQuestion, subQuestion.number))"
                    @pause="handleQuestionAudioEnded(getAnswerKey(currentQuestion, subQuestion.number))"
                  />
                  <button
                    class="btn btn-primary"
                    type="button"
                    :disabled="activeQuestionAudioKey === getAnswerKey(currentQuestion, subQuestion.number) || getRemainingQuestionAudioPlays(getAnswerKey(currentQuestion, subQuestion.number)) === 0"
                    @click="playQuestionAudioByKey(getAnswerKey(currentQuestion, subQuestion.number))"
                  >
                    {{ activeQuestionAudioKey === getAnswerKey(currentQuestion, subQuestion.number) ? 'Audio sedang diputar' : `Putar Audio Soal ${subQuestion.number}` }}
                  </button>
                  <p class="small-note">
                    Sisa putar audio soal ini: {{ getRemainingQuestionAudioPlays(getAnswerKey(currentQuestion, subQuestion.number)) }} dari 2
                  </p>
                </div>

                <div class="quiz-question-card" style="margin-top: 14px;">
                  <div class="quiz-question-card__media-stack">
                    <div class="quiz-question-card__image-wrap">
                      <img
                        class="quiz-question-card__image"
                        :src="subQuestion.image"
                        :alt="`Question ${subQuestion.number}`"
                      />
                    </div>
                  </div>
                </div>

                <div class="quiz-choice-grid">
                  <button
                    v-for="(choice, choiceIndex) in subQuestion.choices ?? ['1', '2', '3', '4']"
                    :key="`${subQuestion.number}-${choiceIndex}`"
                    class="quiz-choice"
                    :class="{ 'quiz-choice--selected': answers[getAnswerKey(currentQuestion, subQuestion.number)] === choiceIndex + 1 }"
                    type="button"
                    @click="chooseAnswer(choiceIndex + 1, subQuestion.number)"
                  >
                    <span class="quiz-choice__number">{{ choiceIndex + 1 }}</span>
                    <span class="quiz-choice__text">{{ choice }}</span>
                  </button>
                </div>
              </div>
            </template>

            <div
              v-else
              v-for="questionNumber in currentQuestionNumbers"
              :key="`${currentQuestion.id}-${questionNumber}`"
              class="quiz-multi-answer-card"
            >
              <div class="quiz-multi-answer-card__head">
                <strong>Soal {{ questionNumber }}</strong>
                <span class="small-note">
                  {{ answers[getAnswerKey(currentQuestion, questionNumber)] ? `Jawaban ${answers[getAnswerKey(currentQuestion, questionNumber)]}` : 'Belum dijawab' }}
                </span>
              </div>

              <div class="quiz-multi-answer-card__choices">
                <button
                  v-for="choiceNumber in 4"
                  :key="`${questionNumber}-${choiceNumber}`"
                  class="quiz-micro-choice"
                  :class="{ 'quiz-micro-choice--selected': answers[getAnswerKey(currentQuestion, questionNumber)] === choiceNumber }"
                  type="button"
                  @click="chooseAnswer(choiceNumber, questionNumber)"
                >
                  {{ choiceNumber }}
                </button>
              </div>
            </div>
          </div>

          <div class="button-row" style="margin-top: 24px;">
            <button class="btn btn-secondary" type="button" @click="exitQuiz">
              Keluar
            </button>
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
              Selesaikan Kuis
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
              :disabled="isQuestionMapLocked"
              @click="jumpToQuestion(index)"
            >
              {{ index + 1 }}
            </button>
          </div>

          <div class="milestone-list" style="margin-top: 18px;">
            <div>Kartu di sesi ini: {{ totalCards }}</div>
            <div>Soal yang dinilai: {{ totalQuestions }}</div>
            <div>Level: {{ levelId.toUpperCase() }}</div>
            <div v-if="isQuestionMapLocked">Tunggu audio selesai sebelum pindah lewat peta soal.</div>
          </div>
        </aside>
      </div>

      <div v-else-if="submitted" class="quiz-result panel">
        <p class="eyebrow">Hasil Kuis</p>
        <h1 class="title">Nilai {{ scorePercent }}%</h1>
        <p class="subtitle">
          Kamu menjawab benar {{ correctCount }} dari {{ totalQuestions }} soal.
        </p>
        <p class="small-note" style="margin-top: 12px;">
          Minimum kelulusan: {{ passingCorrect }} / {{ totalQuestions }} benar.
          {{ passedQuiz ? 'Lulus, node berikutnya terbuka jika tersedia.' : 'Belum lulus, jadi tahap berikutnya belum terbuka.' }}
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

        <div v-if="incorrectQuestionSummaries.length" class="quiz-review-card">
          <p class="quiz-review-card__title">Soal yang perlu dicek lagi</p>
          <p class="small-note">
            Berikut nomor soal yang masih salah. Kunci jawaban sengaja tidak ditampilkan supaya bisa kamu audit sendiri bila ada yang terasa janggal.
          </p>

          <div class="quiz-review-list">
            <div
              v-for="item in incorrectQuestionSummaries"
              :key="item.key"
              class="quiz-review-item"
            >
              <strong>{{ item.label }}</strong>
              <span class="small-note">
                {{ item.userAnswer ? `Jawabanmu: ${item.userAnswer}` : 'Belum ada jawaban terekam' }}
              </span>
            </div>
          </div>
        </div>

        <div class="button-row" style="margin-top: 24px;">
          <button class="btn btn-primary" type="button" @click="router.push(`/island/${levelId}`)">
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
        <h1>Kuis belum tersedia</h1>
        <p class="small-note">Bank soal untuk rute ini belum terhubung ke alur kuis.</p>
        <div class="button-row" style="justify-content: center; margin-top: 20px;">
          <button class="btn btn-primary" type="button" @click="router.push(`/island/${levelId}`)">
            Kembali ke Pulau
          </button>
        </div>
      </div>
    </section>
  </AppShell>
</template>
