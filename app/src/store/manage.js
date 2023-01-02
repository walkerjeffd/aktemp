import { ascending } from 'd3'
import { restrictedApi } from '@/plugins/axios'
import { errorMessage } from '@/plugins/error-message'
import { countDays } from 'aktemp-utils/time'

export default {
  namespaced: true,
  state: () => ({
    status: {
      providers: {
        loading: false,
        error: null
      },
      provider: {
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
    providers: [],
    provider: null,
    stations: [],
    files: [],
    series: [],
    profiles: [],
    flagTypes: []
  }),
  getters: {
    providers: state => state.providers,
    provider: state => state.provider,
    stations: state => state.stations,
    files: state => state.files,
    series: state => state.series,
    profiles: state => state.profiles,
    providerStatus: state => state.status.provider,
    providersStatus: state => state.status.providers,
    stationsStatus: state => state.status.stations,
    filesStatus: state => state.status.files,
    seriesStatus: state => state.status.series,
    profilesStatus: state => state.status.profiles,
    flagTypes: state => state.flagTypes
  },
  mutations: {
    SET_PROVIDERSS (state, providers) {
      state.providers = providers
    },
    SET_PROVIDERS (state, provider) {
      state.provider = provider
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
    async setProvider ({ commit, dispatch }, provider) {
      commit('SET_PROVIDERS', provider)
      dispatch('fetchStations')
    },
    async setProviderById ({ commit, state, dispatch }, providerId) {
      commit('SET_STATUS', ['provider', true, null])
      const provider = state.providers.find(d => d.id === +providerId)
      if (!provider) {
        commit('SET_STATUS', ['provider', false, new Error(`Provider (id=${providerId}) not found`)])
        dispatch('setProvider', null)
      } else {
        commit('SET_STATUS', ['provider', false, null])
        dispatch('setProvider', provider)
      }
    },
    async fetchProviders ({ commit, state }) {
      commit('SET_STATUS', ['providers', true, null])
      try {
        const data = await restrictedApi
          .get('/providers')
          .then(d => d.data)
        commit('SET_PROVIDERSS', data)
        commit('SET_STATUS', ['providers', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['providers', false, err])
      }
    },
    async fetchStations ({ commit, state }) {
      if (!state.provider) return
      commit('SET_STATUS', ['stations', true, null])
      try {
        const data = await restrictedApi
          .get(`/providers/${state.provider.id}/stations`)
          .then(d => d.data)
        data.forEach(d => {
          d.series_count_days = countDays(d.series_start_datetime, d.series_end_datetime, d.timezone)
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
      if (!state.provider) return
      commit('SET_STATUS', ['files', true, null])
      try {
        const data = await restrictedApi
          .get(`/providers/${state.provider.id}/files`)
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
      if (!state.provider) return
      commit('SET_STATUS', ['series', true, null])
      try {
        const data = await restrictedApi
          .get(`/providers/${state.provider.id}/series`)
          .then(d => d.data)
        commit('SET_SERIES', data)
        commit('SET_STATUS', ['series', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['series', false, err])
      }
    },
    async fetchProfiles ({ commit, state }) {
      if (!state.provider) return
      commit('SET_STATUS', ['profiles', true, null])
      try {
        const data = await restrictedApi
          .get(`/providers/${state.provider.id}/profiles`)
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
