<template>
  <v-main>
    <v-container>
      <v-row justify="space-around">
        <v-col cols="12">
          <v-card elevation="4">
            <v-toolbar flat dense color="grey lighten-3">
              <v-toolbar-title v-if="!$vuetify.breakpoint.mobile">
                <span class="text-h6">Batch Import Stations</span>
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn text @click="$router.push({ name: 'manageStations' })">
                <v-icon left>mdi-chevron-left</v-icon> <span v-if="!$vuetify.breakpoint.mobile">Back to Stations</span><span v-else>Back</span>
              </v-btn>
            </v-toolbar>

            <v-form ref="form" @submit.prevent="submit" :disabled="loading">
              <v-card-text>
                <div class="text-h6 mb-2">Organization</div>
                <p class="black--text">Select the organization for these stations.</p>
                <v-row>
                  <v-col cols="12" md="6" lg="4">
                    <v-select
                      v-model="organization.selected"
                      :items="organizations"
                      :rules="organization.rules"
                      label="Organization"
                      item-text="code"
                      validate-on-blur
                      outlined
                      return-object
                    ></v-select>
                  </v-col>
                </v-row>

                <v-divider class="mb-4"></v-divider>

                <div class="text-h6 mb-2">Stations Table</div>

                <v-row>
                  <v-col cols="12">
                    <p class="black--text"><strong>Need help getting started?</strong> Download the Excel template and follow the instructions on the README sheet.</p>
                    <v-btn
                      color="primary"
                      outlined
                      bloc
                      href="static/AKTEMP-stations-template.xlsx"
                      download
                      class="mb-4"
                    ><v-icon left>mdi-download</v-icon> Download Template</v-btn>
                    <p class="black--text">After you have filled out the table in the template, copy and paste your stations (excluding header row) from Excel into the table below. Right-click to add/remove rows.</p>
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
                    :type="col.type"
                    :source="col.source"
                    :allow-empty="col.allowEmpty"
                    :validator="col.validator"
                    :read-only="col.readOnly"
                    :renderer="col.renderer"
                    :width="col.width"
                  ></HotColumn>
                </HotTable>
                  <div class="text-caption mt-2">Status: {{ message || 'Ready' }}</div>
                <div class="text--secondary caption">
                  * = Required. Ctrl+c/Ctrl+v to copy/paste. Right-click to add/remove rows or undo/redo.
                </div>

                <div v-if="table.selected" class="max-width:800px">
                  <Alert
                    v-if="table.selected.status === 'INVALID'"
                    type="error"
                    title="Validation Failed"
                  >
                    <table class="mt-2">
                      <tbody>
                        <tr>
                          <td class="text-right pr-2">Row:</td>
                          <td class="font-weight-bold">{{ table.selected.table_row }}</td>
                        </tr>
                        <tr>
                          <td class="text-right pr-2">Code:</td>
                          <td class="font-weight-bold">{{ table.selected.code || '(Missing)' }}</td>
                        </tr>
                      </tbody>
                    </table>

                    <p class="mt-4">Please fix the following errors, then click Submit to try again</p>
                    <ul>
                      <li v-for="(err, i) in table.selected.errors" :key="'err-' + i" class="mb-2">
                        <div v-html="err.error"></div>
                        <div v-if="err.column && err.column.type === 'dropdown'">
                          Allowed values: {{ err.column.source.map(d => `'${d}'`).join(', ') }}
                        </div>
                        <div v-if="err.details" v-html="err.details"></div>
                      </li>
                    </ul>
                  </Alert>
                  <Alert
                    v-else-if="table.selected.status === 'SUCCESS'"
                    type="success"
                    title="Station Created"
                    style="max-width:800px"
                  >
                    <table class="mt-2">
                      <tbody>
                        <tr>
                          <td class="text-right pr-2">Row:</td>
                          <td class="font-weight-bold">{{ table.selected.table_row }}</td>
                        </tr>
                        <tr>
                          <td class="text-right pr-2">Code:</td>
                          <td class="font-weight-bold">{{ table.selected.code }}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div class="mt-4">This station has been successfully saved to the server.</div>
                  </Alert>
                  <Alert
                    v-else-if="table.selected.status === 'FAILED'"
                    type="error"
                    title="Failed to Create Station"
                    style="max-width:800px"
                  >
                    <table class="mt-2">
                      <tbody>
                        <tr>
                          <td class="text-right pr-2">Row:</td>
                          <td class="font-weight-bold">{{ table.selected.table_row }}</td>
                        </tr>
                        <tr>
                          <td class="text-right pr-2">Code:</td>
                          <td class="font-weight-bold">{{ table.selected.code }}</td>
                        </tr>
                      </tbody>
                    </table>

                    <div class="body-1 font-weight-bold mt-4">Server Errors</div>
                    <p>Please fix the following errors, then click Submit to try again</p>
                    <ul>
                      <li v-for="(err, i) in table.selected.errors" :key="'err-' + i" class="mb-2">
                        <div v-html="err.error"></div>
                        <div v-if="err.details" v-html="err.details"></div>
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
                  <p>
                    {{ table.failedCount.toLocaleString() }} station(s) failed to be validated or saved to the server (marked by <span style="color:white;background-color:#ff5252;width:6px">&nbsp;✕&nbsp;</span>). Click on the table row for more details.
                  </p>
                  <div v-if="table.rows.length > table.failedCount">
                    <div>
                      Stations marked by <span style="color:white;background-color:#4caf50;width:6px">&nbsp;✓&nbsp;</span> have been saved to the server and can be safely removed from the table above. Click the following button to remove them leaving only the remaining stations that failed to be saved.
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
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
/* eslint-disable node/no-callback-literal */
import Handsontable from 'handsontable'
import { mapGetters } from 'vuex'

import evt from '@/events'
import { timezoneOptions, placementOptions, waterbodyTypeOptions, booleanOptions, fieldConstraints } from '@/lib/constants'
import { parseBooleanOption, isNumber, emptyStringToNull } from '@/lib/utils'

export default {
  name: 'ManageStationsBatch',
  data () {
    return {
      loading: false,
      error: null,
      message: '',

      organization: {
        selected: null,
        rules: [
          v => !!v || 'Organization is required'
        ],
        stations: []
      },

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
            allowEmpty: false,
            validate: (row) => row.code &&
              !this.stationCodes.includes(row.code) &&
              row.code.length <= fieldConstraints.station.code.maxLength,
            rule: `<b>Code</b> is required, must be ${fieldConstraints.station.code.maxLength} or fewer characters, and must be unique within an organization.`,
            width: '100px'
          },
          {
            prop: 'latitude',
            label: 'Latitude*',
            allowEmpty: false,
            validate: (row) => row.latitude && isNumber(row.latitude) && Number(row.latitude) >= 45 && Number(row.latitude) <= 75,
            rule: '<b>Latitude</b> must be a decimal number between 45 and 75',
            width: '80px'
          },
          {
            prop: 'longitude',
            label: 'Longitude*',
            allowEmpty: false,
            validate: (row) => row.longitude && isNumber(row.longitude) && Number(row.longitude) >= -180 && Number(row.longitude) <= -125,
            rule: '<b>Longitude</b> must be a decimal number between -125 and -180',
            width: '80px'
          },
          {
            prop: 'timezone',
            label: 'Timezone*',
            validate: (row) => timezoneOptions.map(d => d.value).includes(row.timezone),
            rule: '<b>Timezone</b> is required and must match an allowed value',
            type: 'dropdown',
            source: timezoneOptions.map(d => d.value),
            width: '100px'
          },
          {
            prop: 'waterbody_type',
            label: 'Waterbody Type',
            validate: (row) => !row.waterbody_type || waterbodyTypeOptions.map(d => d.value).includes(row.waterbody_type),
            rule: '<b>Waterbody Type</b> must match an allowed value',
            type: 'dropdown',
            source: waterbodyTypeOptions.map(d => d.value)
          },
          {
            prop: 'waterbody_name',
            label: 'Waterbody Name',
            validate: (row) => !row.waterbody_name || row.waterbody_name.length <= fieldConstraints.station.waterbodyName.maxLength,
            rule: `<b>Waterbody Name</b> must be ${fieldConstraints.station.waterbodyName.maxLength} or fewer characters`,
            width: '150px'
          },
          {
            prop: 'description',
            label: 'Description',
            validate: (row) => !row.description || row.description.length <= fieldConstraints.station.description.maxLength,
            rule: `<b>Description</b> must be ${fieldConstraints.station.description.maxLength} or fewer characters`,
            width: '150px'
          },
          {
            prop: 'placement',
            label: 'Placement',
            validate: (row) => !row.placement || placementOptions.map(d => d.value).includes(row.placement),
            rule: '<b>Placement</b> must match an allowed value',
            type: 'dropdown',
            source: placementOptions.map(d => d.value)
          },
          {
            prop: 'active',
            label: 'Active',
            validate: (row) => !row.active || booleanOptions.map(d => d.value).includes(row.active),
            rule: '<b>Active</b> must match an allowed value',
            type: 'dropdown',
            source: booleanOptions.map(d => d.value),
            width: '80px'
          },
          {
            prop: 'mixed',
            label: 'Well-mixed',
            validate: (row) => !row.mixed || booleanOptions.map(d => d.value).includes(row.mixed),
            rule: '<b>Well-mixed</b> must match an allowed value',
            type: 'dropdown',
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
            validate: (row) => !row.private || booleanOptions.map(d => d.value).includes(row.private),
            rule: '<b>Private</b> must match an allowed value',
            type: 'dropdown',
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
          fixedColumnsStart: 3,
          manualColumnResize: true,
          preventOverflow: 'horizontal',
          dataSchema: {
            status: '',
            code: '',
            description: '',
            latitude: '',
            longitude: '',
            timezone: '',
            placement: '',
            waterbody_name: '',
            waterbody_type: '',
            active: '',
            mixed: '',
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
      defaultOrganization: 'manage/organization'
    }),
    stationCodes () {
      return this.organization.stations.map(d => d.code)
    }
  },
  watch: {
    defaultOrganization () {
      this.setDefaultOrganization()
    },
    'organization.selected' () {
      this.fetchOrganizationStations()
    }
  },
  mounted () {
    Handsontable.hooks.add('afterSelection', this.afterSelection, this.$refs.hot.hotInstance)
    this.setDefaultOrganization()
  },
  beforeDestroy () {
    Handsontable.hooks.remove('afterSelection', this.afterSelection, this.$refs.hot.hotInstance)
  },
  methods: {
    setDefaultOrganization () {
      this.organization.selected = this.defaultOrganization || null
    },
    afterSelection (i) {
      const row = this.table.rows[i]
      this.table.selected = row
    },
    renderHot () {
      if (this.$refs.hot) {
        this.$refs.hot.hotInstance.render()
      }
    },
    async fetchOrganizationStations () {
      if (!this.organization.selected) {
        this.organization.stations = []
        return
      }
      try {
        this.organization.stations = await this.$http.restricted
          .get(`/organizations/${this.organization.selected.id}/stations`)
          .then(d => d.data)
      } catch (err) {
        this.error = this.$errorMessage(err)
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

      // reset status if failed or invalid
      this.table.rows.forEach(d => {
        d.status = d.status === 'FAILED' || d.status === 'INVALID' ? null : d.status
        d.errors = []
      })
      this.table.failedCount = 0

      // validate and save
      this.loading = true
      let nonEmptyRows = 0
      for (let i = 0; i < this.table.rows.length; i++) {
        const row = this.table.rows[i]

        // skip empty rows
        if (this.$refs.hot.hotInstance.isEmptyRow(i)) continue

        try {
          nonEmptyRows += 1
          const isValid = await this.validateRow(row, i)
          if (isValid) {
            await this.createStation(row)
          }
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
      if (row.status === 'SUCCESS') return true
      const hot = this.$refs.hot.hotInstance
      this.message = `Validating ${row.code}`
      row.status = 'VALIDATING'
      row.errors = []
      this.renderHot()

      try {
        this.table.columns.forEach((column, j) => {
          if (column.validate && !column.validate(row)) {
            hot.setCellMeta(i, j, 'valid', false)
            row.errors.push({
              error: `${column.rule} (value: ${JSON.stringify(row[column.prop])})`,
              column
            })
          } else {
            hot.setCellMeta(i, j, 'valid', true)
          }
        })
      } catch (err) {
        console.error(err)
        row.errors.push({
          error: 'Unexpected error during validation',
          details: this.$errorMessage(err)
        })
      }

      if (row.errors.length > 0) {
        row.status = 'INVALID'
      } else {
        row.status = 'READY'
      }
      this.renderHot()
      this.message = null

      return row.status === 'READY'
    },
    async createStation (row) {
      if (row.status === 'SUCCESS' || row.status === 'INVALID') return

      const organizationId = this.organization.selected.id

      const payload = {
        code: row.code.trim(),
        description: emptyStringToNull(row.description),
        latitude: row.latitude,
        longitude: row.longitude,
        timezone: row.timezone,
        placement: emptyStringToNull(row.placement),
        waterbody_name: emptyStringToNull(row.waterbody_name),
        waterbody_type: emptyStringToNull(row.waterbody_type),
        active: parseBooleanOption(row.active),
        mixed: parseBooleanOption(row.mixed),
        reference: emptyStringToNull(row.reference),
        private: row.private ? parseBooleanOption(row.private) : false
      }

      row.status = 'UPLOADING'
      this.renderHot()

      try {
        this.message = `Saving ${payload.code}`
        await this.$http.restricted
          .post(`/organizations/${organizationId}/stations`, payload)
        row.status = 'SUCCESS'
      } catch (err) {
        console.log(err)
        row.status = 'FAILED'
        row.error = this.$errorMessage(err)
      } finally {
        this.message = null
        this.renderHot()
      }
    },
    removeSavedStations () {
      this.stations = this.stations.filter(d => d.status !== 'SUCCESS')
    }
  }
}
</script>

<style>

</style>
