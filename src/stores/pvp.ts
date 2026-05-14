import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from './auth'
import { createN5ExamQuestions } from '../data/quizzes'
import { computed } from 'vue'



export const usePvpStore = defineStore('pvp', () => {
  const authStore = useAuthStore()
  const currentRoom = ref<any>(null)
  const players = ref<any[]>([])

  const currentQuestion = computed(() => {
  if (!currentRoom.value) return null

  console.log(
    'ROOM QUESTIONS:',
    currentRoom.value.questions
  )

  console.log(
    'CURRENT INDEX:',
    currentRoom.value.current_question_index
  )

  const index =
    currentRoom.value.current_question_index || 0

  return currentRoom.value.questions?.[index]
})

  let playersChannel: any = null
  let roomChannel: any = null

  // Fungsi membuat room (Host)
  const createRoom = async (playerName: string) => {
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase()
    
    const randomQuestions = createN5ExamQuestions()

    const { data: room, error } = await supabase
      .from('pvp_rooms')
      .insert([{ invite_code: inviteCode, questions: randomQuestions }])
      .select()
      .maybeSingle()

    if (error) throw error
    currentRoom.value = room
    
    // Player yang buat otomatis jadi Host
    await joinRoom(inviteCode, playerName, true)
    await fetchPlayers(room.id)
  }

  // Fungsi join room (Guest/Host)
  const joinRoom = async (inviteCode: string, playerName: string, isHost = false) => {
    const { data: room, error: roomError } = await supabase
      .from('pvp_rooms')
      .select('*')
      .eq('invite_code', inviteCode)
      .maybeSingle()

    if (roomError || !room) {
  throw new Error('Room tidak ditemukan!')
        }
    currentRoom.value = room

    // Cek dulu apakah player sudah masuk (cegah duplikat saat refresh)
    const { data: existingPlayer } = await supabase
      .from('pvp_players')
      .select('*')
      .eq('room_id', room.id)
      .eq('user_id', authStore.currentUser?.id)
      .maybeSingle()

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
    await fetchPlayers(room.id)
    subscribeToRoomUpdates(room.id)
  }

  const fetchPlayers = async (roomId: string) => {
  const { data } = await supabase
    .from('pvp_players')
    .select('*')
    .eq('room_id', roomId)

  players.value = data || []

  // Kalau player sudah 2, mulai battle
  if (
  players.value.length === 2 &&
  currentRoom.value &&
  !currentRoom.value.battle_started
) {
  await supabase
    .from('pvp_rooms')
    .update({
      battle_started: true,
      status: 'playing'
    })
    .eq('id', roomId)

  // Fetch ulang room terbaru
  const { data: updatedRoom } = await supabase
    .from('pvp_rooms')
    .select('*')
    .eq('id', roomId)
    .maybeSingle()

  if (updatedRoom) {
    currentRoom.value = updatedRoom
  }
}
}

  const subscribeToRoomUpdates = (roomId: string) => {
  // Cleanup channel lama
  if (playersChannel) {
    supabase.removeChannel(playersChannel)
  }

  if (roomChannel) {
    supabase.removeChannel(roomChannel)
  }

  // Players realtime
  playersChannel = supabase
    .channel(`players-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'pvp_players',
        filter: `room_id=eq.${roomId}`
      },
      async (payload) => {
        console.log('PLAYER UPDATE:', payload)

        await fetchPlayers(roomId)
      }
    )
    .subscribe((status) => {
      console.log(`players-${roomId}:`, status)
    })

  // Room realtime
  roomChannel = supabase
    .channel(`room-${roomId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'pvp_rooms',
        filter: `id=eq.${roomId}`
      },
      (payload) => {
        console.log('ROOM UPDATE:', payload)

        currentRoom.value = payload.new
      }
    )
    .subscribe((status) => {
      console.log(`room-${roomId}:`, status)
    })
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

  const submitAnswer = async (
  selectedChoice: number
) => {
  if (!currentRoom.value || !currentQuestion.value)
    return

  if (currentRoom.value.question_resolved)
    return

  const correctAnswer =
    currentQuestion.value.answer

  // Kalau salah
  if (selectedChoice !== correctAnswer)
    return

  // lock question
  const { data: updatedRoom } =
    await supabase
      .from('pvp_rooms')
      .update({
        question_resolved: true
      })
      .eq('id', currentRoom.value.id)
      .eq('question_resolved', false)
      .select()
      .maybeSingle()

  // kalah race
  if (!updatedRoom) return

  const opponent = players.value.find(
    p =>
      p.user_id !== authStore.currentUser?.id
  )

  if (!opponent) return

  const newHp = Math.max(
    0,
    opponent.hp - 20
  )

  await supabase
    .from('pvp_players')
    .update({
      hp: newHp
    })
    .eq('id', opponent.id)

  await supabase
    .from('pvp_rooms')
    .update({
      current_question_index:
        currentRoom.value.current_question_index + 1,

      question_resolved: false
    })
    .eq('id', currentRoom.value.id)
}
  const cleanupRealtime = () => {
  if (playersChannel) {
    supabase.removeChannel(playersChannel)
    playersChannel = null
  }

  if (roomChannel) {
    supabase.removeChannel(roomChannel)
    roomChannel = null
  }
}

const leaveRoom = () => {
  cleanupRealtime()

  currentRoom.value = null
  players.value = []
}


  return {
    currentRoom,
    players,
    currentQuestion,

    createRoom,
    joinRoom,
    attackOpponent,
    leaveRoom,
    submitAnswer,
    cleanupRealtime
  }
})