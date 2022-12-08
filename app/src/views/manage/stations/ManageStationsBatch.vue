<template>
  <v-card elevation="2">
    <v-toolbar flat dense>
      <v-toolbar-title>
        <span class="text-h6">Batch Import Stations</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text small @click="$router.push({ name: 'manageStations' })">
        <v-icon small left>mdi-chevron-left</v-icon> Back to Stations
      </v-btn>
    </v-toolbar>
    <v-divider></v-divider>

    <v-form ref="form" @submit.prevent="submit" :disabled="loading">
      <v-card-text class="black--text">
        <v-row>
          <v-col cols="12">
            <p>Fill out the table below to create one or more new stations. Rows and/or columns can be copy-and-pasted directly from Excel into this table.</p>
            <p><strong>Need help getting started?</strong> Download the Excel template and follow the instructions on the README sheet.</p>
            <v-btn
              color="primary"
              outlined
              bloc
              href="static/AKTEMP-stations-template.xlsx"
              download
              class="mb-4"
            ><v-icon left>mdi-download</v-icon> Download Template</v-btn>
          </v-col>
        </v-row>

        <HotTable
          ref="hot"
          :data="table.rows"
          :colHeaders="true"
          :settings="table.settings"
          class="elevation-2"
        >
          <HotColumn
            v-for="col in table.columns"
            :key="col.prop"
            :data="col.prop"
            :title="col.label"
            :settings="col"
          ></HotColumn>
        </HotTable>
          <div class="text-caption mt-2">Status: {{ message || 'Ready' }}</div>
        <div class="text--secondary caption">
          * = Required. Ctrl+c/Ctrl+v to copy/paste. Right-click to add/remove rows or undo/redo.
        </div>

        <div v-if="table.selected" class="pt-4" style="max-width:800px">
          <Alert
            v-if="table.selected.status === 'INVALID'"
            type="error"
            :title="`Validation Failed on Row ${table.selected.row + 1}`"
          >
            <p>Please fix the following errors, then click Submit to try again</p>
            <ul>
              <li v-for="(err, i) in table.selected.errors" :key="'err-' + i" class="mb-2">
                <div v-html="err.message"></div>
              </li>
            </ul>
          </Alert>
          <Alert
            v-else-if="table.selected.status === 'SUCCESS'"
            type="success"
            :title="`Station Created on Row ${table.selected.row + 1}`"
          >
            <table class="mt-2">
              <tbody>
                <tr>
                  <td class="text-right pr-2">Station Code:</td>
                  <td class="font-weight-bold">
                    <router-link :to="{
                      name: 'manageStation',
                      params: {
                        orgnizationId: this.$route.params.organizationId,
                        stationId: table.selected.station.id
                      }
                    }">
                      {{ table.selected.code }}
                    </router-link>
                  </td>
                </tr>
              </tbody>
            </table>

            <div class="mt-4">This station has been successfully saved to the server and can be removed from the import table.</div>
          </Alert>
          <Alert
            v-else-if="table.selected.status === 'FAILED'"
            type="error"
            :title="`Server Error on Row ${table.selected.row + 1}`"
          >
            <p>The station passed validation, but could not be saved to the server.</p>
            <p>Please fix the following errors, then click Submit to try again.</p>
            <ul>
              <li v-for="(err, i) in table.selected.errors" :key="'err-' + i" class="mb-2">
                <div>{{ err.message }}</div>
              </li>
            </ul>
          </Alert>
        </div>

        <Alert
          v-if="table.failedCount > 0"
          type="warning"
          title="Table Contains Invalid Stations"
          style="max-width:800px"
          class="mb-0 mt-4"
        >
          <div>
            {{ table.failedCount.toLocaleString() }} station(s) failed. Click on any row marked by <span style="color:white;background-color:#ff5252;width:6px">&nbsp;✕&nbsp;</span> for more details.
          </div>
          <div v-if="table.rows.length > table.failedCount" class="mt-4">
            <div>
              Stations marked by <span style="color:white;background-color:#4caf50;width:6px">&nbsp;✓&nbsp;</span> have been saved to the server and can be safely removed from the table above. Click the following button to remove them leaving only the stations that failed.
            </div>
            <v-btn color="default" @click="removeSavedStations" class="mt-4">
              <v-icon small left>mdi-close</v-icon> Remove Saved Stations
            </v-btn>
          </div>
        </Alert>

        <div v-if="error">
          <v-divider class="my-4"></v-divider>
          <Alert type="error" title="Error" class="mb-0" style="max-width:800px">{{ error }}</Alert>
        </div>
      </v-card-text>

      <v-divider></v-divider>

      <v-card-actions class="pa-4">
        <v-btn
          type="submit"
          color="primary"
          class="mr-4"
          :loading="loading"
        >Submit</v-btn>
        <v-btn
          color="default"
          text
          @click="initTable"
          :disabled="loading || this.table.rows.length === 0"
        >Clear</v-btn>

        <v-spacer></v-spacer>

        <v-btn
          color="default"
          text
          @click="$router.push({ name: 'manageStations' })"
        >Cancel</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>
/* eslint-disable node/no-callback-literal */
import Handsontable from 'handsontable'
import { mapGetters } from 'vuex'

import evt from '@/events'

const { validateStation } = require('aktemp-utils/validators')

const {
  stationTimezoneOptions,
  placementOptions,
  waterbodyTypeOptions,
  booleanOptions
} = require('aktemp-utils/constants')

export default {
  name: 'ManageStationsBatch',
  data () {
    return {
      loading: false,
      error: null,
      message: '',

      table: {
        selected: null,
        failedCount: 0,
        rows: [],
        columns: [
          {
            prop: 'status',
            label: '✓',
            width: '30px',
            renderer: function (instance, td, row, col, prop, value, cellProperties) {
              td.className = 'htCenter'
              if (value === 'SUCCESS') {
                td.innerText = '✓'
                td.style.color = 'white'
                td.style.background = '#4caf50'
              } else if (value === 'FAILED' || value === 'INVALID') {
                td.innerText = '✕'
                td.style.color = 'white'
                td.style.background = '#ff5252'
              } else if (value === 'VALIDATING') {
                td.innerText = '↺'
                td.style.color = 'white'
                td.style.background = '#1976d2'
              } else if (value === 'UPLOADING') {
                td.innerText = '⇧'
                td.style.color = 'white'
                td.style.background = '#fb8c00'
              } else {
                td.innerText = ''
                td.style.background = '#EEE'
              }
            },
            readOnly: true
          },
          {
            prop: 'code',
            label: 'Code*',
            width: '100px'
          },
          {
            prop: 'latitude',
            label: 'Latitude*',
            width: '80px'
          },
          {
            prop: 'longitude',
            label: 'Longitude*',
            width: '80px'
          },
          {
            prop: 'timezone',
            label: 'Timezone*',
            type: 'dropdown',
            strict: false,
            source: stationTimezoneOptions.map(d => d.value),
            width: '100px'
          },
          {
            prop: 'description',
            label: 'Description',
            width: '150px'
          },
          {
            prop: 'waterbody_name',
            label: 'Waterbody Name',
            width: '150px'
          },
          {
            prop: 'waterbody_type',
            label: 'Waterbody Type',
            type: 'dropdown',
            strict: false,
            source: waterbodyTypeOptions.map(d => d.value)
          },
          {
            prop: 'placement',
            label: 'Placement',
            type: 'dropdown',
            strict: false,
            source: placementOptions.map(d => d.value)
          },
          {
            prop: 'mixed',
            label: 'Well-mixed',
            type: 'dropdown',
            strict: false,
            source: booleanOptions.map(d => d.value),
            width: '80px'
          },
          {
            prop: 'active',
            label: 'Active',
            type: 'dropdown',
            strict: false,
            source: booleanOptions.map(d => d.value),
            width: '80px'
          },
          {
            prop: 'reference',
            label: 'Reference URL',
            width: '150px'
          },
          {
            prop: 'private',
            label: 'Private',
            type: 'dropdown',
            strict: false,
            source: booleanOptions.map(d => d.value)
          }
        ],
        settings: {
          height: 270,
          renderAllRows: true,
          licenseKey: 'non-commercial-and-evaluation',
          contextMenu: ['row_above', 'row_below', 'remove_row', '---------', 'clear_column', '---------', 'undo', 'redo'],
          minRows: 1,
          rowHeaders: true,
          rowHeaderWidth: 40,
          fixedColumnsStart: 2,
          manualColumnResize: true,
          preventOverflow: 'horizontal',
          dataSchema: {
            status: '',
            code: '',
            latitude: '',
            longitude: '',
            timezone: '',
            description: '',
            waterbody_name: '',
            waterbody_type: '',
            placement: '',
            mixed: '',
            active: '',
            reference: '',
            private: ''
          }
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      organizations: 'manage/organizations',
      organization: 'manage/organization'
    })
  },
  mounted () {
    Handsontable.hooks.add('afterSelection', this.afterSelection, this.$refs.hot.hotInstance)
  },
  beforeDestroy () {
    Handsontable.hooks.remove('afterSelection', this.afterSelection, this.$refs.hot.hotInstance)
  },
  methods: {
    afterSelection (i) {
      const row = this.table.rows[i]
      this.table.selected = row
    },
    renderHot () {
      if (this.$refs.hot) {
        this.$refs.hot.hotInstance.render()
      }
    },
    initTable () {
      this.error = null
      this.table.rows.splice(0, this.table.rows.length)
      this.table.selected = null
      this.renderHot()
    },
    async submit () {
      this.error = null
      this.table.selected = null

      // check form inputs (organization)
      if (!this.$refs.form.validate()) {
        this.error = 'Check form errors above'
        return
      }

      // validate and save
      this.loading = true
      this.table.failedCount = 0
      let nonEmptyRows = 0
      for (let i = 0; i < this.table.rows.length; i++) {
        let row = this.table.rows[i]

        // skip empty rows
        if (this.$refs.hot.hotInstance.isEmptyRow(i)) continue

        try {
          nonEmptyRows += 1
          row = await this.createStation(row, i)
          if (row.status === 'INVALID' || row.status === 'FAILED') {
            this.table.failedCount += 1
          }
        } catch (err) {
          console.log(err)
          this.error = this.$errorMessage(err)
          this.message = null
          break
        }
      }
      this.loading = false
      this.renderHot()

      if (nonEmptyRows === 0) {
        this.error = 'Table is empty'
      } else if (!this.table.rows.some(d => d.status !== 'SUCCESS')) {
        evt.$emit('notify', 'Stations have been successfully created', 'success')
        return this.$router.push({ name: 'manageStations' })
      }
    },
    async validateRow (row, i) {
      // console.log('validateRow()', i, row)
      const hot = this.$refs.hot.hotInstance

      if (row.status === 'SUCCESS') return true
      if (hot.isEmptyRow(i)) return true

      this.message = `Validating ${row.code}`

      this.table.columns.forEach((column, j) => {
        hot.setCellMeta(i, j, 'valid', true)
      })
      row.status = 'VALIDATING'
      row.errors = []
      row.row = i
      row.station = null

      this.renderHot()

      try {
        const { status, errors, row: rowId, station, ...value } = row
        // console.log('validateStation', value)
        row.station = validateStation(value)
      } catch (err) {
        console.log('err', err.details)
        if (!err.details) {
          row.errors = [{
            message: err.message || this.$errorMessage(err),
            details: err
          }]
        } else {
          row.errors = err.details
          row.errors.forEach(d => {
            const prop = d.path[0]
            const j = hot.propToCol(prop)
            const column = this.table.columns[j]
            d.message = d.message.replace(`"${prop}"`, `<strong>${column.label.replace('*', '')}</strong>`)
            hot.setCellMeta(i, j, 'valid', false)
          })
        }
      }

      if (row.errors.length > 0) {
        row.status = 'INVALID'
      } else {
        row.status = 'READY'
      }
      this.renderHot()
      this.message = null

      return row
    },
    async createStation (row, i) {
      // console.log('createStation()', i, row)
      if (row.status === 'SUCCESS') return

      const organizationId = this.organization.id

      try {
        row = await this.validateRow(row, i)
      } catch (err) {
        this.error = err.toString()
        return row
      }

      if (!row.station) return row

      row.status = 'UPLOADING'
      this.renderHot()

      try {
        this.message = `Saving ${row.station.code}`
        const result = await this.$http.restricted
          .post(`/organizations/${organizationId}/stations`, row.station)
          .then(d => d.data)
        row.station.id = result.id
        row.status = 'SUCCESS'
      } catch (err) {
        console.log(err)
        row.status = 'FAILED'
        row.errors = [{
          message: this.$errorMessage(err),
          details: err
        }]
        if (row.errors[0].message.startsWith('Station code')) {
          const hot = this.$refs.hot.hotInstance
          hot.setCellMeta(i, hot.propToCol('code'), 'valid', false)
        }
      } finally {
        this.message = null
        this.renderHot()
      }
      return row
    },
    async removeSavedStations () {
      this.loading = true
      const rowsToRemove = []
      this.table.rows.forEach((d, i) => {
        if (d.status === 'SUCCESS') rowsToRemove.push([i, 1])
      })
      this.$refs.hot.hotInstance.alter('remove_row', rowsToRemove)
      this.table.rows.forEach((d, i) => {
        d.row = i
      })
      this.loading = false
      this.renderHot()
    }
  }
}
</script>

<style>

</style>
