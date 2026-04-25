import n5MojiGoiBank from './n5-moji-goi.json'

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
      subtitle: 'Random 20 questions from the 33-question practice bank.',
      questionCount: 20,
      questions: shuffle(n5MojiGoiBank).slice(0, 20),
    }
  }

  return null
}
