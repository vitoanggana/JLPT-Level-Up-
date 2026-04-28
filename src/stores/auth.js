import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

const USERS_STORAGE_KEY = 'jlpt-level-up-users'
const SESSION_STORAGE_KEY = 'jlpt-level-up-session'

const seededUsers = [
  {
    id: 'admin-1',
    name: 'Admin JLPT',
    loginId: 'admin',
    email: 'admin@jlpt.quest',
    password: 'admin',
    role: 'admin',
  },
  {
    id: 'user-1',
    name: 'Player One',
    loginId: 'user',
    email: 'user@jlpt.quest',
    password: 'user',
    role: 'user',
  },
]

function cloneSeededUsers() {
  return JSON.parse(JSON.stringify(seededUsers))
}

function normalizeUsers(rawUsers) {
  const fallbackUsers = cloneSeededUsers()

  if (!Array.isArray(rawUsers) || !rawUsers.length) {
    return fallbackUsers
  }

  return rawUsers.map((user) => {
    const seededMatch = fallbackUsers.find((seededUser) => seededUser.role === user?.role)

    return {
      ...seededMatch,
      ...user,
      loginId: user?.loginId ?? seededMatch?.loginId ?? '',
      password: user?.loginId ? user.password : (seededMatch?.password ?? user?.password ?? ''),
      email: user?.email ?? seededMatch?.email ?? '',
    }
  })
}

function loadUsers() {
  const raw = localStorage.getItem(USERS_STORAGE_KEY)

  if (!raw) {
    const fallback = cloneSeededUsers()
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(fallback))
    return fallback
  }

  try {
    return normalizeUsers(JSON.parse(raw))
  } catch {
    return cloneSeededUsers()
  }
}

function loadSessionUserId() {
  return localStorage.getItem(SESSION_STORAGE_KEY) ?? ''
}

export const useAuthStore = defineStore('auth', () => {
  const users = ref(loadUsers())
  const currentUserId = ref(loadSessionUserId())

  const currentUser = computed(() => {
    return users.value.find((user) => user.id === currentUserId.value) ?? null
  })

  const isAuthenticated = computed(() => Boolean(currentUser.value))
  const isAdmin = computed(() => currentUser.value?.role === 'admin')

  function persistUsers() {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users.value))
  }

  function persistSession() {
    if (currentUserId.value) {
      localStorage.setItem(SESSION_STORAGE_KEY, currentUserId.value)
      return
    }

    localStorage.removeItem(SESSION_STORAGE_KEY)
  }

  function resetSeedUsers() {
    users.value = cloneSeededUsers()
    persistUsers()
  }

  function login(loginId, password) {
    const normalizedLoginId = loginId.trim().toLowerCase()
    const matchedUser = users.value.find((user) => user.loginId?.toLowerCase() === normalizedLoginId)

    if (!matchedUser) {
      return { success: false, message: 'ID tidak ditemukan.' }
    }

    if (matchedUser.password !== password) {
      return { success: false, message: 'Password salah.' }
    }

    currentUserId.value = matchedUser.id
    persistSession()

    return {
      success: true,
      user: matchedUser,
      message: `Login berhasil sebagai ${matchedUser.role}.`,
    }
  }

  function logout() {
    currentUserId.value = ''
    persistSession()
  }

  persistUsers()
  persistSession()

  return {
    users,
    currentUser,
    isAuthenticated,
    isAdmin,
    login,
    logout,
    resetSeedUsers,
  }
})
