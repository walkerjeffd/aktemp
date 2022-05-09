import Vue from 'vue'
import Vuex from 'vuex'

import adminModule from './admin'
import manageModule from './manage'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    admin: adminModule,
    manage: manageModule
  },
  state: {
    user: null
  },
  getters: {
    user: state => state.user,
    userId: state => state.user ? state.user.username : null
  },
  mutations: {
    SET_USER (state, user) {
      state.user = user
    }
  },
  actions: {
    setUser ({ commit }, user) {
      commit('SET_USER', user)
      return user
    }
  }
})
