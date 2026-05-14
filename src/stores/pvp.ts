import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'

export const usePvpStore = defineStore('pvp', () => {
  const authStore = useAuthStore()
  const currentRoom = ref<any>(null)
  const players = ref<any[]>([])

  // Fungsi membuat room (Host)
  const createRoom = async (playerName: string) => {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    // Ambil 10 soal acak (nantinya bisa dibuat lebih dinamis)
    const randomQuestions = ['n5-bunpou-q1', 'n5-moji-q5', 'n5-chokai-q3'] 

    const { data: room, error } = await supabase
      .from('pvp_rooms')
      .insert([{ invite_code: inviteCode, questions: randomQuestions }])
      .select()
      .single()

    if (error) throw error
    currentRoom.value = room
    
    // Player yang buat otomatis jadi Host
    await joinRoom(inviteCode, playerName, true)
  }

  // Fungsi join room (Guest/Host)
  const joinRoom = async (inviteCode: string, playerName: string, isHost = false) => {
    const { data: room, error: roomError } = await supabase
      .from('pvp_rooms')
      .select('*')
      .eq('invite_code', inviteCode)
      .single()

    if (roomError) throw new Error('Room tidak ditemukan!')
    currentRoom.value = room

    // Cek dulu apakah player sudah masuk (cegah duplikat saat refresh)
    const { data: existingPlayer } = await supabase
      .from('pvp_players')
      .select('*')
      .eq('room_id', room.id)
      .eq('user_id', authStore.currentUser?.id)
      .single()

    if (!existingPlayer) {
      await supabase
        .from('pvp_players')
        .insert([{ 
          room_id: room.id, 
          user_id: authStore.currentUser?.id,
          player_name: playerName, 
          hp: 100,
          is_host: isHost
        }])
    }

    // Ambil semua player yang sudah ada di room
    fetchPlayers(room.id)
    subscribeToRoomUpdates(room.id)
  }

  const fetchPlayers = async (roomId: string) => {
    const { data } = await supabase
      .from('pvp_players')
      .select('*')
      .eq('room_id', roomId)
    if (data) players.value = data
  }

  const subscribeToRoomUpdates = (roomId: string) => {
    // Realtime Players (Darah, Nama, dll)
    supabase
      .channel('players_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'pvp_players', 
        filter: `room_id=eq.${roomId}` 
      }, () => {
        fetchPlayers(roomId) // Ambil ulang data player tiap ada perubahan
      })
      .subscribe()

    // Realtime Room (Status game Mulai/Selesai)
    supabase
      .channel('room_changes')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'pvp_rooms', 
        filter: `id=eq.${roomId}` 
      }, (payload) => {
        currentRoom.value = payload.new
      })
      .subscribe()
  }

  const attackOpponent = async (damage: number = 20) => {
    if (!currentRoom.value) return

    // Cari player mana yang BUKAN kita (si lawan)
    const opponent = players.value.find(p => p.user_id !== authStore.currentUser?.id)
    
    if (opponent) {
      const newHp = Math.max(0, opponent.hp - damage)
      await supabase
        .from('pvp_players')
        .update({ hp: newHp })
        .eq('id', opponent.id)
    }
  }

  return {
    currentRoom,
    players,
    createRoom,
    joinRoom,
    attackOpponent
  }
})