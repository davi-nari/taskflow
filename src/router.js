import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import { getSupabaseSession, isSupabaseConfigured } from '@/data/supabaseApi'
import { bootstrapWorkspace } from '@/data/workspaceBootstrap'

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { publicView: true, publicAccess: true },
    },
    {
      path: '/',
      name: 'Dashboard',
      component: Dashboard,
    },
    {
      path: '/tasks',
      name: 'Tasks',
      component: () => import('@/views/Tasks.vue'),
    },
    {
      path: '/reports',
      name: 'Reports',
      component: () => import('@/views/Reports.vue'),
    },
    {
      path: '/analytics',
      name: 'Analytics',
      component: () => import('@/views/Analytics.vue'),
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('@/views/Settings.vue'),
    },
    {
      path: '/manager/:token',
      name: 'ManagerView',
      component: () => import('@/views/ManagerView.vue'),
      meta: { publicView: true, publicAccess: true },
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.name === 'ManagerView') return true
  if (!isSupabaseConfigured()) return true

  const session = await getSupabaseSession()

  if (to.name === 'Login') {
    if (!session) return true
    await bootstrapWorkspace()
    return { path: '/' }
  }

  if (!session) {
    return {
      path: '/login',
      query: { redirect: to.fullPath },
    }
  }

  await bootstrapWorkspace()
  return true
})
