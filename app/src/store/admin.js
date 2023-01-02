import { adminApi } from '@/plugins/axios'
import { errorMessage } from '@/plugins/error-message'

export default {
  namespaced: true,
  state: () => ({
    status: {
      organizations: {
        loading: false,
        error: null
      },
      providers: {
        loading: false,
        error: null
      },
      users: {
        loading: false,
        error: null
      }
    },
    providers: [],
    organizations: [],
    users: []
  }),
  getters: {
    providers: state => state.providers,
    organizations: state => state.organizations,
    users: state => state.users,
    providersStatus: state => state.status.providers,
    organizationsStatus: state => state.status.organizations,
    usersStatus: state => state.status.users
  },
  mutations: {
    SET_ORGANIZATIONS (state, organizations) {
      state.organizations = organizations
    },
    SET_PROVIDERS (state, providers) {
      state.providers = providers
    },
    SET_USERS (state, users) {
      state.users = users
    },
    SET_STATUS (state, [collection, loading, error]) {
      state.status[collection].loading = loading
      state.status[collection].error = errorMessage(error)
    }
  },
  actions: {
    async fetchOrganizations ({ commit }) {
      commit('SET_STATUS', ['organizations', true, null])
      try {
        const data = await adminApi.get('/organizations').then(d => d.data)
        commit('SET_ORGANIZATIONS', data)
        commit('SET_STATUS', ['organizations', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['organizations', false, err])
      }
    },
    async fetchProviders ({ commit }) {
      commit('SET_STATUS', ['providers', true, null])
      try {
        const data = await adminApi.get('/providers').then(d => d.data)
        commit('SET_PROVIDERS', data)
        commit('SET_STATUS', ['providers', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['providers', false, err])
      }
    },
    async fetchUsers ({ commit }) {
      commit('SET_STATUS', ['users', true, null])
      try {
        const response = await adminApi.get('/users')
        const data = response.data
        commit('SET_USERS', data)
        commit('SET_STATUS', ['users', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['users', false, err])
      }
    }
  }
}
