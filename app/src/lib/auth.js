import Vue from 'vue'
import { Auth } from 'aws-amplify'

import evt from '@/events'
import store from '@/store'
import router from '@/router'

evt.$on('authState', async ({ state, redirect }) => {
  if (state === 'signedOut') {
    store.dispatch('setUser', null)
    // router.push(redirect || { name: 'home' })
  } else if (state === 'signIn') {
    await getUser()
    if (redirect) router.push(redirect)
  } else if (state === 'signInRefresh') {
    await getUser(true)
    if (redirect) router.push(redirect)
  } else if (state === 'confirmSignUp') {
    router.push({ name: 'signupConfirm' })
  }
})

export async function getToken () {
  const session = await Auth.currentSession()
  return session.getIdToken().getJwtToken()
}

export async function getOrganizations (userId) {
  try {
    const response = await Vue.prototype.$http.restricted.get('/organizations')
    return response.data
  } catch (err) {
    return null
  }
}

export async function getUser (force) {
  try {
    const user = await Auth.currentAuthenticatedUser({ bypassCache: !!force })
    if (user && user.signInUserSession) {
      user.organizations = await getOrganizations(user.username)
      user.UserGroups = user.signInUserSession.accessToken.payload['cognito:groups'] || []
      user.isAdmin = user.UserGroups.includes('admins')
      store.dispatch('setUser', user)
      return user
    }
    return null
  } catch (err) {
    if (err.code && err.code === 'UserNotConfirmedException') {
      evt.$emit('authState', { state: 'confirmSignUp' })
    } else {
      await Auth.signOut()
      evt.$emit('authState', { state: 'signedOut' })
    }
    return null
  }
}