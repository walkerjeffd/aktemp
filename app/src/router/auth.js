import Auth from '@/views/auth/Auth.vue'
import Account from '@/views/auth/Account.vue'
import Login from '@/views/auth/Login.vue'
import Request from '@/views/auth/Request.vue'
import Signup from '@/views/auth/Signup.vue'
import SignupConfirm from '@/views/auth/SignupConfirm.vue'
import Logout from '@/views/auth/Logout.vue'
import ChangePassword from '@/views/auth/ChangePassword.vue'
import ResetPassword from '@/views/auth/ResetPassword.vue'

export default {
  path: '/auth',
  name: 'auth',
  component: Auth,
  redirect: { name: 'login' },
  children: [
    {
      path: 'request',
      name: 'request',
      component: Request
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
