import { createRouter, createWebHistory } from 'vue-router'

import LandingView from '../views/LandingView.vue'
import LoginView from '../views/LoginView.vue'
import MapView from '../views/MapView.vue'
import IslandView from '../views/IslandView.vue'
import QuizView from '../views/QuizView.vue'
import ProfileView from '../views/ProfileView.vue'
import NotFoundView from '../views/NotFoundView.vue'
import { pinia } from '../stores'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', name: 'landing', component: LandingView, meta: { public: true } },
    { path: '/login', name: 'login', component: LoginView, meta: { public: true } },
    { path: '/map', name: 'map', component: MapView },
    { path: '/island/:levelId', name: 'island', component: IslandView, props: true },
    { path: '/quiz/:levelId/:categoryId', name: 'quiz', component: QuizView, props: true },
    { path: '/profile', name: 'profile', component: ProfileView },
    { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFoundView },
  ],
})

router.beforeEach((to) => {
  const authStore = useAuthStore(pinia)

  if (!to.meta.public && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'map' }
  }

  return true
})

export default router
