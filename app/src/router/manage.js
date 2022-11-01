import Manage from '@/views/manage/Manage.vue'

import ManageOrganization from '@/views/manage/ManageOrganization.vue'

import ManageStationsHome from '@/views/manage/stations/ManageStationsHome.vue'
import ManageStationsList from '@/views/manage/stations/ManageStationsList.vue'
import ManageStationsBatch from '@/views/manage/stations/ManageStationsBatch.vue'
import ManageStation from '@/views/manage/stations/ManageStation.vue'

import ManageFilesHome from '@/views/manage/files/ManageFilesHome.vue'
import ManageFilesList from '@/views/manage/files/ManageFilesList.vue'
import ManageFileForm from '@/views/manage/files/ManageFileForm.vue'
import ManageFilesBatch from '@/views/manage/files/ManageFilesBatch.vue'
import ManageFile from '@/views/manage/files/ManageFile.vue'

import ManageQaqc from '@/views/manage/qaqc/ManageQaqc.vue'
import ManageQaqcSeries from '@/views/manage/qaqc/ManageQaqcSeries.vue'

import ManageExport from '@/views/manage/export/ManageExport.vue'

export default [
  {
    path: '/manage',
    name: 'manage',
    component: Manage,
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: '/manage/:organizationId',
        name: 'manageOrganization',
        component: ManageOrganization,
        redirect: { name: 'manageStations' },
        children: [
          {
            path: 'stations',
            component: ManageStationsHome,
            redirect: { name: 'manageStations' },
            children: [
              {
                path: '',
                name: 'manageStations',
                component: ManageStationsList
              },
              {
                path: 'batch',
                name: 'manageStationsBatch',
                component: ManageStationsBatch
              },
              {
                path: ':stationId',
                name: 'manageStation',
                component: ManageStation
              }
            ]
          },
          {
            path: 'files',
            component: ManageFilesHome,
            redirect: { name: 'manageFiles' },
            children: [
              {
                path: '',
                name: 'manageFiles',
                component: ManageFilesList
              },
              {
                path: 'upload',
                name: 'manageFileForm',
                component: ManageFileForm
              },
              {
                path: 'batch',
                name: 'manageFilesBatch',
                component: ManageFilesBatch
              },
              {
                path: ':fileId',
                name: 'manageFile',
                component: ManageFile
              }
            ]
          },
          {
            path: 'qaqc',
            name: 'manageQaqc',
            component: ManageQaqc,
            children: [
              {
                path: ':seriesId',
                name: 'manageQaqcSeries',
                component: ManageQaqcSeries
              }
            ]
          },
          {
            path: 'export',
            name: 'manageExport',
            component: ManageExport
          }
        ]
      }
    ]
  }
]
