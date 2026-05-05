import n5MojiGoiBank from './n5-moji-goi.json'
import n5BunpouDokkaiBank from './n5-bunpou-dokkai.json'

import type { CategoryId, LevelId, QuizDefinition, QuizQuestion } from '../../types'

const n5MojiGoiQuestions = n5MojiGoiBank as QuizQuestion[]
const n5BunpouDokkaiQuestions = n5BunpouDokkaiBank as QuizQuestion[]

function shuffle<T>(array: T[]): T[] {
  const clone = [...array]

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]]
  }

  return clone
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

  return null
}
