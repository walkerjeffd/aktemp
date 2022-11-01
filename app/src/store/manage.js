import { ascending } from 'd3'
import { restrictedApi } from '@/plugins/axios'
import { errorMessage } from '@/plugins/error-message'
import { countDays } from 'aktemp-utils/time'

export default {
  namespaced: true,
  state: () => ({
    status: {
      organizations: {
        loading: false,
        error: null
      },
      organization: {
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
      },
      profiles: {
        loading: false,
        error: null
      },
      flagTypes: {
        loading: false,
        error: null
      }
    },
    organizations: [],
    organization: null,
    stations: [],
    files: [],
    series: [],
    profiles: [],
    flagTypes: []
  }),
  getters: {
    organizations: state => state.organizations,
    organization: state => state.organization,
    stations: state => state.stations,
    files: state => state.files,
    series: state => state.series,
    profiles: state => state.profiles,
    organizationStatus: state => state.status.organization,
    organizationsStatus: state => state.status.organizations,
    stationsStatus: state => state.status.stations,
    filesStatus: state => state.status.files,
    seriesStatus: state => state.status.series,
    profilesStatus: state => state.status.profiles,
    flagTypes: state => state.flagTypes
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
    SET_PROFILES (state, profiles) {
      state.profiles = profiles
    },
    SET_FLAG_TYPES (state, flagTypes) {
      state.flagTypes = flagTypes
    },
    SET_STATUS (state, [collection, loading, error]) {
      state.status[collection].loading = loading
      state.status[collection].error = errorMessage(error)
    }
  },
  actions: {
    async setOrganization ({ commit, dispatch }, organization) {
      commit('SET_ORGANIZATION', organization)
      dispatch('fetchStations')
    },
    async setOrganizationById ({ commit, state, dispatch }, organizationId) {
      commit('SET_STATUS', ['organization', true, null])
      const organization = state.organizations.find(d => d.id === +organizationId)
      if (!organization) {
        commit('SET_STATUS', ['organization', false, new Error(`Organization (id=${organizationId}) not found`)])
        dispatch('setOrganization', null)
      } else {
        commit('SET_STATUS', ['organization', false, null])
        dispatch('setOrganization', organization)
      }
    },
    async fetchOrganizations ({ commit, state }) {
      commit('SET_STATUS', ['organizations', true, null])
      try {
        const data = await restrictedApi
          .get('/organizations')
          .then(d => d.data)
        commit('SET_ORGANIZATIONS', data)
        commit('SET_STATUS', ['organizations', false, null])
        // if (data.length > 0) {
        //   // set default if
        //   //   1. not already set
        //   //   2. already set, but no longer available
        //   if (!state.organization || (state.organization && !data.map(d => d.id).includes(state.organization.id))) {
        //     commit('SET_ORGANIZATION', data[0])
        //   }
        // } else if (state.organization) {
        //   // no organizations, set selected to null
        //   commit('SET_ORGANIZATION')
        // }
        return data
      } catch (err) {
        commit('SET_STATUS', ['organizations', false, err])
      }
    },
    async fetchStations ({ commit, state }) {
      if (!state.organization) return
      commit('SET_STATUS', ['stations', true, null])
      try {
        const data = await restrictedApi
          .get(`/organizations/${state.organization.id}/stations`)
          .then(d => d.data)
        data.forEach(d => {
          d.series_count_days = countDays(d.series_start_timestamp, d.series_end_timestamp, d.timezone)
        })
        commit('SET_STATIONS', data)
        commit('SET_STATUS', ['stations', false, null])
        return { stations: data }
      } catch (err) {
        commit('SET_STATUS', ['stations', false, err])
        return { error: err }
      }
    },
    removeStationById ({ commit, state }, id) {
      const stations = state.stations.filter(d => d.id !== id)
      commit('SET_STATIONS', stations)
    },
    async fetchFiles ({ commit, state }) {
      if (!state.organization) return
      commit('SET_STATUS', ['files', true, null])
      try {
        const data = await restrictedApi
          .get(`/organizations/${state.organization.id}/files`)
          .then(d => d.data)
        commit('SET_FILES', data)
        commit('SET_STATUS', ['files', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['files', false, err])
      }
    },
    removeFileById ({ commit, state }, id) {
      const files = state.files.filter(d => d.id !== id)
      commit('SET_FILES', files)
    },
    async fetchSeries ({ commit, state }) {
      if (!state.organization) return
      commit('SET_STATUS', ['series', true, null])
      try {
        const data = await restrictedApi
          .get(`/organizations/${state.organization.id}/series`)
          .then(d => d.data)
        commit('SET_SERIES', data)
        commit('SET_STATUS', ['series', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['series', false, err])
      }
    },
    async fetchProfiles ({ commit, state }) {
      if (!state.organization) return
      commit('SET_STATUS', ['profiles', true, null])
      try {
        const data = await restrictedApi
          .get(`/organizations/${state.organization.id}/profiles`)
          .then(d => d.data)
        commit('SET_PROFILES', data)
        commit('SET_STATUS', ['profiles', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['profiles', false, err])
      }
    },
    async fetchFlagTypes ({ commit }) {
      commit('SET_STATUS', ['flagTypes', true, null])
      try {
        const data = await restrictedApi
          .get('/flag-types')
          .then(d => d.data)
        data.sort((a, b) => ascending(a.id, b.id))
        const other = data.splice(data.findIndex(d => d.id === 'OTHER'), 1)

        commit('SET_FLAG_TYPES', [...data, ...other])
        commit('SET_STATUS', ['flagTypes', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['flagTypes', false, err])
      }
    }
  }
}
