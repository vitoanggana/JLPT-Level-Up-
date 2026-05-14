import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'

export const usePvpStore = defineStore('pvp', () => {
  const currentRoom = ref<any>(null)
  const players = ref<any[]>([])
  let roomSubscription: any = null
  let playersSubscription: any = null

  // Fungsi membuat room (Host)
  const createRoom = async (playerName: string) => {
    // Generate kode random 6 karakter
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    // (Opsional) Ambil array ID pertanyaan acak dari data N5 kamu
    const randomQuestions = ['n5-bunpou-q1', 'n5-moji-q5', 'n5-chokai-q3'] 

    const { data: room, error } = await supabase
      .from('pvp_rooms')
      .insert([{ invite_code: inviteCode, questions: randomQuestions }])
      .select()
      .single()

    if (error) throw error
    currentRoom.value = room
    
    await joinRoom(inviteCode, playerName)
  }

  // Fungsi join room (Guest)
  const joinRoom = async (inviteCode: string, playerName: string) => {
    // Cari room berdasarkan kode
    const { data: room, error: roomError } = await supabase
      .from('pvp_rooms')
      .select('*')
      .eq('invite_code', inviteCode)
      .single()

    if (roomError) throw roomError
    currentRoom.value = room

    // Insert player ke room tersebut
    const { error: playerError } = await supabase
      .from('pvp_players')
      .insert([{ room_id: room.id, player_name: playerName, hp: 100 }])
    
    if (playerError) throw playerError

    // Mulai dengarkan (listen) perubahan real-time!
    subscribeToRoomUpdates(room.id)
  }

  // Fungsi mendengarkan WebSocket Realtime
  const subscribeToRoomUpdates = (roomId: string) => {
    // Listen perubahan pada HP / status pemain
    playersSubscription = supabase
      .channel('players_channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pvp_players', filter: `room_id=eq.${roomId}` }, 
        (payload) => {
          console.log('Update Player:', payload)
          // Nanti di sini kita update ref players() agar UI darah Vue bereaksi
        }
      )
      .subscribe()

    // Listen perubahan pada status room (misal host klik "Mulai")
    roomSubscription = supabase
      .channel('room_channel')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'pvp_rooms', filter: `id=eq.${roomId}` }, 
        (payload) => {
          console.log('Update Room:', payload)
          currentRoom.value = payload.new
        }
      )
      .subscribe()
  }

  const reduceOpponentHp = async (opponentId: string, damage: number = 20) => {
    // Fungsi dipanggil saat kita jawab benar lebih dulu
    // (Harus ambil HP terakhir lalu kurangi, disederhanakan dulu di sini)
  }

  return {
    currentRoom,
    players,
    createRoom,
    joinRoom,
    reduceOpponentHp
  }
})