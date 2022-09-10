import { publicApi } from '@/plugins/axios'
import { errorMessage } from '@/plugins/error-message'

export default {
  namespaced: true,
  state: () => ({
    status: {
      organizations: {
        loading: false,
        error: null
      },
      stations: {
        loading: false,
        error: null
      }
    },
    organizations: [],
    stations: []
  }),
  getters: {
    organizations: state => state.organizations,
    stations: state => state.stations,
    organizationsStatus: state => state.status.organizations,
    stationsStatus: state => state.status.stations
  },
  mutations: {
    SET_ORGANIZATIONS (state, organizations) {
      state.organizations = organizations
    },
    SET_STATIONS (state, stations) {
      state.stations = stations
    },
    SET_STATUS (state, [collection, loading, error]) {
      state.status[collection].loading = loading
      state.status[collection].error = errorMessage(error)
    }
  },
  actions: {
    async fetchOrganizations ({ commit, state }) {
      commit('SET_STATUS', ['organizations', true, null])
      try {
        const response = await publicApi.get('/organizations')
        const data = response.data
        commit('SET_ORGANIZATIONS', data)
        commit('SET_STATUS', ['organizations', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['organizations', false, err])
      }
    },
    async fetchStations ({ commit, state }) {
      commit('SET_STATUS', ['stations', true, null])
      try {
        const response = await publicApi.get('/stations')
        const data = response.data
        commit('SET_STATIONS', data)
        commit('SET_STATUS', ['stations', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['stations', false, err])
      }
    }
  }
}
