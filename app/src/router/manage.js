import Manage from '@/views/manage/Manage.vue'

import ManageStations from '@/views/manage/stations/ManageStations.vue'
import ManageStationsBatch from '@/views/manage/stations/ManageStationsBatch.vue'
import ManageStation from '@/views/manage/stations/ManageStation.vue'

import ManageFiles from '@/views/manage/files/ManageFiles.vue'
import ManageFileForm from '@/views/manage/files/ManageFileForm.vue'
import ManageFilesBatch from '@/views/manage/files/ManageFilesBatch.vue'
import ManageFile from '@/views/manage/files/ManageFile.vue'

import ManageSeries from '@/views/manage/series/ManageSeries.vue'
import ManageSeriesOne from '@/views/manage/series/ManageSeriesOne.vue'

import ManageProfiles from '@/views/manage/profiles/ManageProfiles.vue'
import ManageProfile from '@/views/manage/profiles/ManageProfile.vue'

import ManageQaqc from '@/views/manage/qaqc/ManageQaqc.vue'
import ManageQaqcSeries from '@/views/manage/qaqc/ManageQaqcSeries.vue'

export default [
  {
    path: '/manage',
    name: 'manage',
    component: Manage,
    redirect: { name: 'manageStations' },
    meta: {
      requiresAuth: true
    },
    children: [
      {
        path: 'stations',
        name: 'manageStations',
        component: ManageStations
      },
      {
        path: 'files',
        name: 'manageFiles',
        component: ManageFiles
      },
      {
        path: 'series',
        name: 'manageSeries',
        component: ManageSeries,
        children: [
          {
            path: ':seriesId',
            name: 'manageSeriesOne',
            component: ManageSeriesOne
          }
        ]
      },
      {
        path: 'profiles',
        name: 'manageProfiles',
        component: ManageProfiles,
        children: [
          {
            path: ':profileId',
            name: 'manageProfile',
            component: ManageProfile
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
      }
    ]
  },
  {
    path: '/manage/stations/batch',
    name: 'manageStationsBatch',
    component: ManageStationsBatch,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/manage/stations/:stationId',
    name: 'manageStation',
    component: ManageStation,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/manage/files/upload',
    name: 'manageFileForm',
    component: ManageFileForm,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/manage/files/batch',
    name: 'manageFilesBatch',
    component: ManageFilesBatch,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/manage/files/:fileId',
    name: 'manageFile',
    component: ManageFile,
    meta: {
      requiresAuth: true
    }
  }
]
