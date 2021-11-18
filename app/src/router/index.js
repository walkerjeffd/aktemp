import Vue from 'vue'
import VueRouter from 'vue-router'

import Home from '../views/Home.vue'
import Explorer from '../views/Explorer.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: Home
  },
  {
    path: '/explorer',
    name: 'explorer',
    component: Explorer
  }
]

const router = new VueRouter({
  routes
})

export default router
