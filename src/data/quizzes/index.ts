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

function renumberQuestion(question: QuizQuestion, number: number): QuizQuestion {
  return {
    ...question,
    number,
  }
}

function buildRandomBlock(questions: QuizQuestion[], startNumber: number, takeCount: number): QuizQuestion[] {
  return shuffle(questions)
    .slice(0, takeCount)
    .map((question, index) => renumberQuestion(question, startNumber + index))
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
    const mondaiOneAndTwoPool = n5ChoukaiQuestions.filter((question) => question.section === 'choukai-basic')
    const mondaiThreePool = n5ChoukaiQuestions.filter((question) => question.section === 'choukai-mondai-3')
    const mondaiFourPool = n5ChoukaiQuestions.filter((question) => question.section === 'choukai-mondai-4')

    return {
      title: 'N5 Choukai',
      subtitle: '20 soal per blok. Random hanya di dalam tiap mondai, dan tiap audio hanya bisa diputar maksimal 2 kali.',
      questionCount: 20,
      questions: [
        ...buildRandomBlock(mondaiOneAndTwoPool, 1, 10),
        ...buildRandomBlock(mondaiThreePool, 11, 5),
        ...buildRandomBlock(mondaiFourPool, 16, 5),
      ],
      introExample: n5ChoukaiIntroExample,
    }
  }

  return null
}
