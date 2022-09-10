import ExplorerMap from '../views/explorer/map/ExplorerMap.vue'
import ExplorerStation from '../views/explorer/station/ExplorerStation.vue'

export default [
  {
    path: '/explorer',
    name: 'explorer',
    component: ExplorerMap
  },
  {
    path: '/explorer/stations/:stationId',
    name: 'explorerStation',
    component: ExplorerStation
  }
]
