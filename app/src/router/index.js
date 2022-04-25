import Vue from 'vue'
import VueRouter from 'vue-router'

import store from '@/store'
import { getUser } from '@/lib/auth'

import Home from '../views/Home.vue'
import Explorer from '../views/Explorer.vue'

import Auth from '@/views/Auth.vue'
import Account from '@/views/auth/Account.vue'
import Login from '@/views/auth/Login.vue'
import RequestAccount from '@/views/auth/RequestAccount.vue'
import Signup from '@/views/auth/Signup.vue'
import SignupConfirm from '@/views/auth/SignupConfirm.vue'
import Logout from '@/views/auth/Logout.vue'
import ChangePassword from '@/views/auth/ChangePassword.vue'
import ResetPassword from '@/views/auth/ResetPassword.vue'

import Manage from '@/views/Manage.vue'
import ManageStation from '@/views/manage/Station.vue'
import ManageFile from '@/views/manage/File.vue'
// import ManageMetadata from '@/views/manage/station/Metadata.vue'
// import ManageDatasets from '@/views/manage/station/Datasets.vue'
// import ManageDataset from '@/views/manage/station/Dataset.vue'

import Admin from '@/views/Admin.vue'
import AdminAccountRequests from '@/views/admin/AccountRequests.vue'
import AdminUsers from '@/views/admin/Users.vue'

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
  },
  {
    path: '/manage',
    name: 'manage',
    component: Manage,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/manage/stations/:stationId',
    name: 'manageStation',
    component: ManageStation,
    meta: {
      requiresAuth: true
    }
    // children: [
    //   {
    //     path: '',
    //     name: 'manageStation',
    //     component: ManageMetadata
    //   }
    // ]
  },
  {
    path: '/manage/files/:fileId',
    name: 'manageFile',
    component: ManageFile,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/admin',
    name: 'admin',
    component: Admin,
    redirect: { name: 'adminAccountRequests' },
    meta: {
      requiresAdmin: true
    },
    children: [
      {
        path: 'account-requests',
        name: 'adminAccountRequests',
        component: AdminAccountRequests
      },
      {
        path: 'users',
        name: 'adminUsers',
        component: AdminUsers
      }
    ]
  },
  {
    path: '/auth',
    name: 'auth',
    component: Auth,
    redirect: { name: 'login' },
    children: [
      {
        path: 'request',
        name: 'requestAccount',
        component: RequestAccount
      },
      {
        path: 'account',
        name: 'account',
        component: Account
      },
      {
        path: 'login',
        name: 'login',
        component: Login
      },
      {
        path: 'logout',
        name: 'logout',
        component: Logout
      },
      {
        path: 'signup',
        name: 'signup',
        component: Signup
      },
      {
        path: 'confirm',
        name: 'signupConfirm',
        component: SignupConfirm
      },
      {
        path: 'change-password',
        name: 'changePassword',
        component: ChangePassword
      },
      {
        path: 'reset-password',
        name: 'resetPassword',
        component: ResetPassword
      }
    ]
  }
]

const router = new VueRouter({
  routes
})

let loaded = false
router.beforeEach(async (to, from, next) => {
  if (!loaded) {
    await getUser(true)
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
