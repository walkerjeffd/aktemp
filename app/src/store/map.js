export default {
  namespaced: true,
  state: () => ({
    spatialEnabled: false,
    hucLevel: 'huc4'
  }),
  getters: {
    spatialEnabled: state => state.spatialEnabled,
    hucLevel: state => state.hucLevel
  },
  mutations: {
    SET_SPATIAL_ENABLED (state, spatialEnabled) {
      state.spatialEnabled = spatialEnabled
    },
    SET_HUC_LEVEL (state, hucLevel) {
      state.hucLevel = hucLevel
    }
  },
  actions: {
    async setSpatialEnabled ({ commit }, spatialEnabled) {
      commit('SET_SPATIAL_ENABLED', spatialEnabled)
    },
    async setHucLevel ({ commit }, hucLevel) {
      commit('SET_HUC_LEVEL', hucLevel)
    }
  }
}
