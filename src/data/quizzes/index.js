import n5MojiGoiBank from './n5-moji-goi.json'
import n5BunpouDokkaiBank from './n5-bunpou-dokkai.json'

function shuffle(array) {
  const clone = [...array]

  for (let index = clone.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1))
    ;[clone[index], clone[swapIndex]] = [clone[swapIndex], clone[index]]
  }

  return clone
}

export function getQuizDefinition(levelId, categoryId) {
  if (levelId === 'n5' && categoryId === 'moji-goi') {
    return {
      title: 'N5 Moji Goi',
      subtitle: '20 soal acak dari bank latihan berisi 33 soal.',
      questionCount: 20,
      questions: shuffle(n5MojiGoiBank).slice(0, 20),
    }
  }

  if (levelId === 'n5' && categoryId === 'bunpou-dokkai') {
    const randomPool = n5BunpouDokkaiBank.filter((question) => question.number <= 21)
    const fixedQuestions = n5BunpouDokkaiBank.filter((question) => question.number >= 22)
    const randomQuestions = shuffle(randomPool).slice(0, 19)

    return {
      title: 'N5 Bunpou Dokkai',
      subtitle: '19 soal acak dari q01-q21 ditambah semua soal tetap dari q22-q32.',
      questionCount: 30,
      questions: [...randomQuestions, ...fixedQuestions],
    }
  }

  return null
}
