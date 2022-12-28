import Vue from 'vue'
import Vuex from 'vuex'

import adminModule from './admin'
import cartModule from './cart'
import explorerModule from './explorer'
import manageModule from './manage'
import mapModule from './map'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    admin: adminModule,
    cart: cartModule,
    explorer: explorerModule,
    manage: manageModule,
    map: mapModule
  },
  state: {
    user: null
  },
  getters: {
    user: state => state.user,
    userId: state => state.user ? state.user.username : null,
    userIsAdmin: state => state.user ? !!state.user.isAdmin : false
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
