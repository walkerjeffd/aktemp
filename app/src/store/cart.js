export default {
  namespaced: true,
  state: () => ({
    stations: []
  }),
  getters: {
    stations: state => state.stations
  },
  mutations: {
    SET_STATIONS (state, stations) {
      state.stations = stations
    },
    ADD_STATION (state, station) {
      if (!state.stations.includes(station)) {
        state.stations.push(station)
      }
    },
    REMOVE_STATION (state, station) {
      const index = state.stations.findIndex(d => d === station)
      if (index >= 0) {
        state.stations.splice(index, 1)
      }
    }
  },
  actions: {
    addStations ({ commit }, stations) {
      for (const station of stations) {
        commit('ADD_STATION', station)
      }
    },
    removeStation ({ commit }, station) {
      commit('REMOVE_STATION', station)
    },
    clear ({ commit }) {
      commit('SET_STATIONS', [])
    }
  }
}
