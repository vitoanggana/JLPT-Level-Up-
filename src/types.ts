export type LevelId = 'n5' | 'n4' | 'n3' | 'n2' | 'n1'
export type CategoryId = 'moji-goi' | 'bunpou-dokkai' | 'choukai' | 'exam'
export type UserRole = 'admin' | 'user'
export type QuizQuestionType = 'image' | 'text'
export type QuizSection =
  | 'problem-1'
  | 'fill-blank'
  | 'sentence-order'
  | 'passage-fill'
  | 'reading-match'
  | 'reading-photo'
  | 'reading-letter'
  | 'reading-questions'
  | 'reading-ad'
  | string

export interface QuizImage {
  src: string
  alt?: string
}

export interface QuizSubQuestion {
  number: number
  image: string
  audio: string
  choices?: string[]
}

export interface QuizIntroExample {
  title: string
  prompt: string
  description: string
  audioSrc: string
  imageSrc: string
  imageAlt: string
  choices: string[]
}

export interface SingleAnswerQuestion {
  id: string | number
  number?: number
  section: QuizSection
  type: QuizQuestionType
  prompt: string
  question?: string
  image?: string
  images?: QuizImage[]
  audio?: string
  choices?: string[]
  answer: number
}

export interface MultiAnswerQuestion {
  id: string | number
  number?: number
  section: QuizSection
  type: QuizQuestionType
  prompt: string
  question?: string
  image?: string
  images?: QuizImage[]
  audio?: string
  choices?: string[]
  questionNumbers: number[]
  answers: Record<string, number>
  subQuestions?: QuizSubQuestion[]
}

export type QuizQuestion = SingleAnswerQuestion | MultiAnswerQuestion

export interface QuizDefinition {
  title: string
  subtitle: string
  questionCount: number
  questions: QuizQuestion[]
  introExample?: QuizIntroExample
}

export interface IslandNodeConfig {
  top: string
  left: string
  size: 'medium' | 'large'
}

export interface MapRegion {
  path: string
  labelX: number
  labelY: number
  focusX: number
  focusY: number
  translateX: number
  translateY: number
  scale: number
}

export interface CategoryConfig {
  id: CategoryId
  title: string
  questions: number
  description: string
  islandNode?: IslandNodeConfig
  passingCorrect: number
  unlockAfter: CategoryId[]
}

export interface LevelConfig {
  id: LevelId
  label: string
  name: string
  statusLabel: string
  themeColor: string
  mapRegion: MapRegion
  unlockRequirement: string
  categories: CategoryConfig[]
  islandSilhouette?: string
  milestones: string[]
}

export interface CategoryProgressState {
  completed: boolean
  score: number
  correctCount: number
}

export type CategoryProgressMap = Partial<Record<CategoryId, CategoryProgressState>>

export interface LevelProgressState {
  mastery: number
  categories: CategoryProgressMap
}

export type LevelScoresMap = Partial<Record<LevelId, LevelProgressState>>

export interface ProgressState {
  unlockedLevels: LevelId[]
  completedLevels: LevelId[]
  selectedLevel: LevelId
  levelScores: LevelScoresMap
}

export interface AuthUser {
  id: string
  name: string
  loginId: string
  email: string
  password: string
  role: UserRole
}

export interface LoginFailureResult {
  success: false
  message: string
}

export interface LoginSuccessResult {
  success: true
  user: AuthUser
  message: string
}

export type LoginResult = LoginFailureResult | LoginSuccessResult

export interface CompleteCategoryResult {
  passed: boolean
  passingCorrect: number
  correctCount: number
  completedLevel: boolean
  unlockedNextLevel: boolean
  nextLevelId: LevelId | null
}
