import { restrictedApi } from '@/plugins/axios'

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
      },
      files: {
        loading: false,
        error: null
      },
      series: {
        loading: false,
        error: null
      }
    },
    organizations: [],
    organization: null,
    stations: [],
    files: [],
    series: []
  }),
  getters: {
    organizations: state => state.organizations,
    organization: state => state.organization,
    stations: state => state.stations,
    files: state => state.files,
    series: state => state.series,
    organizationsStatus: state => state.status.organizations,
    stationsStatus: state => state.status.stations,
    filesStatus: state => state.status.files,
    seriesStatus: state => state.status.series
  },
  mutations: {
    SET_ORGANIZATIONS (state, organizations) {
      state.organizations = organizations
    },
    SET_ORGANIZATION (state, organization) {
      state.organization = organization
    },
    SET_STATIONS (state, stations) {
      state.stations = stations
    },
    SET_FILES (state, files) {
      state.files = files
    },
    SET_SERIES (state, series) {
      state.series = series
    },
    SET_STATUS (state, [collection, loading, error]) {
      state.status[collection].loading = loading
      state.status[collection].error = error ? error.toString() || 'Unknown error' : null
    }
  },
  actions: {
    async setOrganization ({ commit }, organization) {
      commit('SET_ORGANIZATION', organization)
    },
    async setOrganizationById ({ commit, state }, organizationId) {
      const organization = state.organizations.find(d => d.id === organizationId)
      commit('SET_ORGANIZATION', organization)
    },
    async fetchOrganizations ({ commit, state }) {
      commit('SET_STATUS', ['organizations', true, null])
      try {
        const response = await restrictedApi.get('/organizations')
        const data = response.data
        commit('SET_ORGANIZATIONS', data)
        commit('SET_STATUS', ['organizations', false, null])
        if (!state.organization && data.length > 0) {
          commit('SET_ORGANIZATION', data[0])
        }
        return data
      } catch (err) {
        commit('SET_STATUS', ['organizations', false, err])
      }
    },
    async fetchStations ({ commit, state }) {
      if (!state.organization) return
      commit('SET_STATUS', ['stations', true, null])
      try {
        const response = await restrictedApi.get(`/organizations/${state.organization.id}/stations`)
        const data = response.data
        commit('SET_STATIONS', data)
        commit('SET_STATUS', ['stations', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['stations', false, err])
      }
    },
    async fetchFiles ({ commit, state }) {
      if (!state.organization) return
      commit('SET_STATUS', ['files', true, null])
      try {
        const response = await restrictedApi.get(`/organizations/${state.organization.id}/files`)
        const data = response.data
        commit('SET_FILES', data)
        commit('SET_STATUS', ['files', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['files', false, err])
      }
    },
    async fetchSeries ({ commit, state }) {
      if (!state.organization) return
      commit('SET_STATUS', ['series', true, null])
      try {
        const response = await restrictedApi.get(`/organizations/${state.organization.id}/series`)
        const data = response.data
        commit('SET_SERIES', data)
        commit('SET_STATUS', ['series', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['series', false, err])
      }
    }
  }
}
