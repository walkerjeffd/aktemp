import Manage from '@/views/manage/Manage.vue'

import ManageStations from '@/views/manage/stations/ManageStations.vue'
import ManageStationsImport from '@/views/manage/stations/ManageStationsImport.vue'
import ManageStation from '@/views/manage/stations/ManageStation.vue'

import ManageFiles from '@/views/manage/files/ManageFiles.vue'
import ManageFileUpload from '@/views/manage/files/ManageFileUpload.vue'
import ManageFileBatch from '@/views/manage/files/ManageFileBatch.vue'
import ManageFile from '@/views/manage/files/ManageFile.vue'

import ManageSeries from '@/views/manage/series/ManageSeries.vue'
import ManageSeriesOne from '@/views/manage/series/ManageSeriesOne.vue'

import ManageProfiles from '@/views/manage/profiles/ManageProfiles.vue'

import ManageQaqc from '@/views/manage/qaqc/ManageQaqc.vue'

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
        component: ManageSeries
      },
      {
        path: 'profiles',
        name: 'manageProfiles',
        component: ManageProfiles
      },
      {
        path: 'qaqc',
        name: 'manageQaqc',
        component: ManageQaqc
      }
    ]
  },
  {
    path: '/manage/stations/import',
    name: 'manageStationsImport',
    component: ManageStationsImport,
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
    name: 'manageFileUpload',
    component: ManageFileUpload,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/manage/files/batch',
    name: 'manageFileBatch',
    component: ManageFileBatch,
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
  },
  {
    path: '/manage/series/:seriesId',
    name: 'manageSeriesOne',
    component: ManageSeriesOne,
    meta: {
      requiresAuth: true
    }
  }
]
