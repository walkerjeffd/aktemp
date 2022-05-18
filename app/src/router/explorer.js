import Explorer from '../views/explorer/Explorer.vue'
import ExplorerStation from '../views/explorer/ExplorerStation.vue'

export default [
  {
    path: '/explorer',
    name: 'explorer',
    component: Explorer
  },
  {
    path: '/explorer/stations/:stationId',
    name: 'explorerStation',
    component: ExplorerStation
  }
]
