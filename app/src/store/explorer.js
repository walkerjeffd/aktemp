import { publicApi } from '@/plugins/axios'
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
      stations: {
        loading: false,
        error: null
      }
    },
    providers: [],
    stations: []
  }),
  getters: {
    providers: state => state.providers,
    stations: state => state.stations,
    providersStatus: state => state.status.providers,
    stationsStatus: state => state.status.stations
  },
  mutations: {
    SET_PROVIDERS (state, providers) {
      state.providers = providers
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
    async fetchProviders ({ commit, state }) {
      commit('SET_STATUS', ['providers', true, null])
      try {
        const response = await publicApi.get('/providers')
        const data = response.data
        commit('SET_PROVIDERS', data)
        commit('SET_STATUS', ['providers', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['providers', false, err])
      }
    },
    async fetchStations ({ commit, state }) {
      commit('SET_STATUS', ['stations', true, null])
      try {
        const data = await publicApi.get('/stations')
          .then(d => d.data)
        data.forEach(d => {
          d.series_count_days = countDays(d.series_start_datetime, d.series_end_datetime, d.timezone)
        })
        commit('SET_STATIONS', data)
        commit('SET_STATUS', ['stations', false, null])
        return data
      } catch (err) {
        commit('SET_STATUS', ['stations', false, err])
      }
    }
  }
}
