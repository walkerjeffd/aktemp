import { adminApi } from '@/plugins/axios'

export default {
  namespaced: true,
  state: () => ({
    status: {
      organizations: {
        loading: false,
        error: null
      },
      users: {
        loading: false,
        error: null
      }
    },
    organizations: [],
    users: []
  }),
  getters: {
    organizations: state => state.organizations,
    users: state => state.users,
    organizationsStatus: state => state.status.organizations,
    usersStatus: state => state.status.users
  },
  mutations: {
    SET_ORGANIZATIONS (state, organizations) {
      state.organizations = organizations
    },
    SET_USERS (state, users) {
      state.users = users
    },
    SET_STATUS (state, [collection, loading, error]) {
      state.status[collection].loading = loading
      state.status[collection].error = error ? error.toString() || 'Unknown error' : null
    }
  },
  actions: {
    async fetchOrganizations ({ commit }) {
      commit('SET_STATUS', ['organizations', true, null])
      try {
        const response = await adminApi.get('/organizations')
        const data = response.data
        data.forEach(d => {
          d.created_at = new Date(d.created_at)
          d.updated_at = new Date(d.updated_at)
        })
        commit('SET_ORGANIZATIONS', data)
        commit('SET_STATUS', ['organizations', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['organizations', false, err])
      }
    },
    async fetchUsers ({ commit }) {
      commit('SET_STATUS', ['users', true, null])
      try {
        const response = await adminApi.get('/users')
        const data = response.data
        data.forEach(d => {
          d.created_at = new Date(d.created_at)
          d.updated_at = new Date(d.updated_at)
        })
        commit('SET_USERS', data)
        commit('SET_STATUS', ['users', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['users', false, err])
      }
    }
  }
}
