import Vue from 'vue'
import VueRouter from 'vue-router'

import store from '@/store'
import { getUser } from '@/lib/auth'

import Home from '../views/Home.vue'

import AdminRoutes from '@/router/admin'
import AuthRoutes from '@/router/auth'
import ExplorerRoutes from '@/router/explorer'
import ManageRoutes from '@/router/manage'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  ...ExplorerRoutes,
  AdminRoutes,
  AuthRoutes,
  ...ManageRoutes
]

const router = new VueRouter({
  routes
})

let loaded = false
router.beforeEach(async (to, from, next) => {
  if (!loaded) {
    getUser(true)
    loaded = true
  }
  if (to.matched.some(record => record.meta.requiresAuth)) {
    let user = store.getters.user
    if (!user) {
      console.log('no user, trying again')
      user = await getUser()
    }
    if (!user) {
      next({
        name: 'login',
        query: { redirect: to.fullPath }
      })
    } else {
      next()
    }
  } else {
    next()
  }
})

export default router
