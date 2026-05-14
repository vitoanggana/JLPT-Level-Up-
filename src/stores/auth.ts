import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { supabase } from '../lib/supabase'

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<any>(null)

  const isAuthenticated = computed(() => Boolean(currentUser.value))
  
  const isAdmin = computed(() => {
    return currentUser.value?.email === 'admin@jlpt.com'
  })

  async function initializeAuth() {
    const { data } = await supabase.auth.getSession()
    currentUser.value = data.session?.user || null

    supabase.auth.onAuthStateChange((_event, session) => {
      currentUser.value = session?.user || null
    })
  }

  async function register(email: string, password: string, nickname: string, favoriteAnime: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          nickname: nickname,
          favorite_anime: favoriteAnime
        }
      }
    })

    if (error) {
      return { success: false, message: error.message }
    }
    return { success: true, message: 'Berhasil membuat akun! Silakan login.' }
  }

  async function login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, message: 'Email atau password salah.' }
    }
    return { success: true, message: 'Login berhasil!' }
  }

  async function logout() {
    await supabase.auth.signOut()
    currentUser.value = null
  }

  async function deleteAccount() {
    const { error } = await supabase.rpc('delete_user')
    
    if (error) {
      return { success: false, message: error.message }
    }
    
    await logout()
    return { success: true, message: 'Akun Anda telah dihapus.' }
  }

  function resetSeedUsers() {
    console.log("Sistem mock sudah diganti ke Supabase.")
  }

  return {
    currentUser,
    isAuthenticated,
    isAdmin,
    initializeAuth,
    register,
    login,
    logout,
    deleteAccount,
    resetSeedUsers,
  }
})