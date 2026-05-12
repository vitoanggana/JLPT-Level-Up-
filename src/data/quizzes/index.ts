import n5MojiGoiBank from './n5-moji-goi.json'
import n5BunpouDokkaiBank from './n5-bunpou-dokkai.json'
import n5ChoukaiBank from './n5-chokai.json'

import type { CategoryId, LevelId, QuizDefinition, QuizIntroExample, QuizQuestion } from '../../types'

const n5MojiGoiQuestions = n5MojiGoiBank as QuizQuestion[]
const n5BunpouDokkaiQuestions = n5BunpouDokkaiBank as QuizQuestion[]
const n5ChoukaiQuestions = n5ChoukaiBank as QuizQuestion[]
const n5ChoukaiIntroExample: QuizIntroExample = {
  title: 'Rei',
  prompt: 'Dengarkan audio contoh terlebih dahulu, lalu pilih jawaban 1, 2, 3, atau 4 berdasarkan gambar.',
  description: 'Contoh ini muncul sebelum set soal choukai dimulai.',
  audioSrc: '/questions/n5-chokai/rei/rei.mp3',
  imageSrc: '/questions/n5-chokai/rei/rei.PNG',
  imageAlt: 'Gambar contoh untuk soal Rei N5 Choukai',
  choices: ['Pilihan 1', 'Pilihan 2', 'Pilihan 3', 'Pilihan 4'],
}

function shuffle<T>(array: T[]): T[] {
  const clone = [...array]

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]]
  }

  return clone
}

function withCategoryId(categoryId: CategoryId, question: QuizQuestion): QuizQuestion {
  return {
    ...question,
    id: `${categoryId}-${String(question.id)}`,
    categoryId,
  }
}

function sortQuestionsByNumber(questions: QuizQuestion[]): QuizQuestion[] {
  return [...questions].sort((left, right) => {
    const leftNumber = left.number ?? Number(left.id)
    const rightNumber = right.number ?? Number(right.id)

    return leftNumber - rightNumber
  })
}

function createN5ChoukaiFullSet(): QuizQuestion[] {
  const firstBlock = shuffle(n5ChoukaiQuestions.filter((question) => {
    const number = question.number ?? 0
    return number >= 1 && number <= 13
  })).slice(0, 10)

  const secondBlock = shuffle(n5ChoukaiQuestions.filter((question) => {
    const number = question.number ?? 0
    return number >= 14 && number <= 18
  })).slice(0, 5)

  const thirdBlock = shuffle(n5ChoukaiQuestions.filter((question) => {
    const number = question.number ?? 0
    return number >= 19 && number <= 24
  })).slice(0, 5)

  return [...firstBlock, ...secondBlock, ...thirdBlock]
}

function createN5ExamQuestions(): QuizQuestion[] {
  const mojiQuestions = shuffle(n5MojiGoiQuestions).slice(0, 10)

  const bunpouGrammarQuestions = sortQuestionsByNumber(
    shuffle(n5BunpouDokkaiQuestions.filter((question) => {
      const number = question.number ?? 0
      return number >= 1 && number <= 21
    })).slice(0, 7),
  )
  const bunpouPassageFill = n5BunpouDokkaiQuestions.find((question) => String(question.id) === 'q22-26')
  const bunpouReadingQuestions = shuffle(
    n5BunpouDokkaiQuestions.filter((question) => ['q27', 'q28', 'q29', 'q32'].includes(String(question.id))),
  ).slice(0, 1)
  const bunpouReadingGroup = n5BunpouDokkaiQuestions.find((question) => String(question.id) === 'q30-31')

  const choukaiBasic = sortQuestionsByNumber(
    shuffle(n5ChoukaiQuestions.filter((question) => {
      const number = question.number ?? 0
      return number >= 1 && number <= 13
    })).slice(0, 5),
  )
  const choukaiMondai3 = sortQuestionsByNumber(
    shuffle(n5ChoukaiQuestions.filter((question) => {
      const number = question.number ?? 0
      return number >= 14 && number <= 18
    })).slice(0, 3),
  )
  const choukaiMondai4 = sortQuestionsByNumber(
    shuffle(n5ChoukaiQuestions.filter((question) => {
      const number = question.number ?? 0
      return number >= 19 && number <= 24
    })).slice(0, 2),
  )

  const bunpouQuestions = [
    ...bunpouGrammarQuestions,
    ...(bunpouPassageFill ? [bunpouPassageFill] : []),
    ...bunpouReadingQuestions,
    ...(bunpouReadingGroup ? [bunpouReadingGroup] : []),
  ]

  const examQuestions = [
    ...mojiQuestions.map((question) => withCategoryId('moji-goi', question)),
    ...bunpouQuestions.map((question) => withCategoryId('bunpou-dokkai', question)),
    ...[...choukaiBasic, ...choukaiMondai3, ...choukaiMondai4].map((question) => withCategoryId('choukai', question)),
  ]

  return examQuestions
}

export function getQuizDefinition(levelId: LevelId, categoryId: CategoryId): QuizDefinition | null {
  if (levelId === 'n5' && categoryId === 'moji-goi') {
    return {
      title: 'N5 Moji Goi',
      subtitle: 'total 20 soal diacak.',
      questionCount: 20,
      questions: shuffle(n5MojiGoiQuestions).slice(0, 20),
    }
  }

  if (levelId === 'n5' && categoryId === 'bunpou-dokkai') {
    const randomPool = n5BunpouDokkaiQuestions.filter((question) => (question.number ?? 0) <= 21)
    const fixedQuestions = n5BunpouDokkaiQuestions.filter((question) => (question.number ?? 0) >= 22)
    const randomQuestions = shuffle(randomPool).slice(0, 19)

    return {
      title: 'N5 Bunpou Dokkai',
      subtitle: 'total 30 soal beberapa diacak.',
      questionCount: 30,
      questions: [...randomQuestions, ...fixedQuestions],
    }
  }

  if (levelId === 'n5' && categoryId === 'choukai') {
    return {
      title: 'N5 Choukai',
      subtitle: '20 soal acak bertahap. tiap audio hanya bisa diputar maksimal 2 kali.',
      questionCount: 20,
      questions: createN5ChoukaiFullSet(),
      introExample: n5ChoukaiIntroExample,
    }
  }

  if (levelId === 'n5' && categoryId === 'exam') {
    return {
      title: 'N5 Exam',
      subtitle: '35 soal campuran: 10 moji-goi, 15 bunpou-dokkai, 10 choukai.',
      questionCount: 35,
      questions: createN5ExamQuestions(),
    }
  }

  return null
}
