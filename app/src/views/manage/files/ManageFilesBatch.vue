<template>
  <v-main>
    <v-container>
      <v-row justify="space-around">
        <v-col cols="12">
          <v-card elevation="4">
            <v-toolbar flat dense color="grey lighten-3">
              <v-toolbar-title v-if="!$vuetify.breakpoint.mobile">
                <span class="text-h6">Batch File Upload</span>
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn text @click="$router.push({ name: 'manageFiles' })">
                <v-icon left>mdi-chevron-left</v-icon> <span v-if="!$vuetify.breakpoint.mobile">Back to Files</span><span v-else>Back</span>
              </v-btn>
            </v-toolbar>

            <v-form ref="form" @submit.prevent="submit" :disabled="loading">
              <v-card-text>
                <!-- ORGANIZATION -->
                <div>
                  <div class="text-h6 mb-2">Organization</div>
                  <p class="black--text">Select the organization for these files.</p>
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
                </div>

                <v-divider class="mb-4"></v-divider>

                <!-- FILES -->
                <div class="text-h6 mb-2">Select Data Files</div>
                <p class="black--text">Each file must be in comma-separated value (CSV) format and only contain data for a single station.</p>
                <v-row>
                  <v-col cols="12" md="6" class="pb-0">
                    <v-file-input
                      ref="filesInput"
                      v-model="files.selected"
                      :rules="files.rules"
                      label="Select data files"
                      truncate-length="200"
                      @change="selectFiles"
                      outlined
                      multiple
                      validate-on-blur
                    >
                    </v-file-input>
                  </v-col>
                </v-row>

                <div v-show="table.rows.length > 0">
                  <v-divider class="mb-4"></v-divider>

                  <div class="text-h6 mb-2">Files Table</div>

                  <p class="black--text"><strong>Need help getting started?</strong> Download the Excel template and follow the instructions on the README sheet. You can also download a list of existing stations for the selected Organization for reference.</p>
                  <v-btn
                    color="primary"
                    outlined
                    bloc
                    href="static/aktemp-files-template.xlsx"
                    download
                    class="mb-4"
                  ><v-icon left>mdi-download</v-icon> Download Template</v-btn>
                  <v-btn
                    color="primary"
                    outlined
                    bloc
                    class="ml-4 mb-4"
                    @click="downloadStationsFile"
                  ><v-icon left>mdi-download</v-icon> Download Stations</v-btn>
                  <p class="black--text">After you have filled out the table in the template, copy and paste the cells from Excel into the table below (excluding the header row).</p>

                  <HotTable
                    :data="table.rows"
                    :colHeaders="true"
                    :settings="table.settings"
                    ref="hot"
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
                  <p>
                    Hint: Ctrl+c/Ctrl+v to copy/paste. Right-click to undo/redo. <br>
                  </p>

                  <Alert
                    type="error"
                    v-for="(d, i) in table.invalidCells.slice(0, table.maxInvalidCellErrors)"
                    :key="i"
                    :title="`Row ${ d.row + 1 }: Invalid ${d.column.label} (${ d.value || 'null' })`"
                    style="max-width:800px"
                  >
                    {{ d.column.rule }}
                  </Alert>

                  <p v-if="table.invalidCells.length > table.maxInvalidCellErrors" class="body-1">
                    and {{ table.invalidCells.length - table.maxInvalidCellErrors }} more...
                  </p>
                </div>

                <div v-if="error" class="pb-1">
                  <v-divider class="mb-4"></v-divider>

                  <Alert type="error" title="Error" class="ma-4" style="max-width:800px">{{ error }}</Alert>
                </div>

                <div v-if="!loading && failedFiles.length > 0" class="pb-1">
                  <v-divider class="mb-4"></v-divider>
                  <Alert type="error" title="Failed to Save Stations" class="my-4" style="max-width:800px">
                    <p>One or more files failed to be saved on the server. Fix the following errors and click Submit to try again.</p>
                    <ul>
                      <li v-for="(file, i) in failedFiles" :key="'failed-' + i">
                        <strong>Row {{ file.$row + 1 }} ({{ file.filename }})</strong>:
                        <ul>
                          <li v-for="(err, j) in file.errors" :key="'error-' + i + '-' + j">
                            {{ err }}
                          </li>
                        </ul>
                      </li>
                    </ul>
                    <div v-if="savedFiles.length > 0">
                      <p class="mt-4">Files marked by <span style="color:white;background-color:#4caf50;width:6px">&nbsp;✓&nbsp;</span> have been saved to the server and can be removed from the table above. Click the following button to remove them and focus on the remaining files that were not saved.</p>
                      <v-btn color="default" @click="removeSavedFiles"><v-icon small left>mdi-delete</v-icon> Remove Saved Files</v-btn>
                    </div>
                  </Alert>
                </div>

                <Alert
                  type="info"
                  :title="message"
                  v-if="message"
                >
                </Alert>
              </v-card-text>

              <v-divider class="mt-4"></v-divider>

              <v-card-actions class="pa-4">
                <v-btn
                  type="submit"
                  color="primary"
                  class="mr-4"
                  :loading="loading"
                >Submit</v-btn>
                <v-btn color="default" text @click="initTable" :disabled="loading || this.table.rows.length === 0">Clear</v-btn>

                <v-spacer></v-spacer>

                <v-btn color="default" text @click="$router.push({ name: 'manageFiles' })">Cancel</v-btn>
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
import { parseCsvFile, joinStrings, parseBooleanOption } from '@/lib/utils'
import uploader from '@/lib/uploader'
import { fileTypeOptions, stationModes, timezoneModes, depthModes, temperatureUnitsOptions, utcOffsetOptions, sensorAccuracyOptions, depthUnitsOptions, booleanOptions, depthCategoryOptions } from '@/lib/constants'

export default {
  name: 'ManageFilesBatch',
  data () {
    return {
      debug: true,
      error: null,
      loading: false,
      message: null,
      files: {
        selected: [],
        type: null,
        rules: [
          v => {
            // if (!v) return true
            if (v.length === 0) return 'No files selected'
            for (let i = 0; i < v.length; i++) {
              const fileExtension = v[i].name.split('.').pop().toLowerCase()
              if (fileExtension !== 'csv') {
                return `Invalid file type ('${v[i].name}'), must be a comma-separated value (CSV) file with extension '.csv'`
              }
            }
            return true
          }
        ]
      },
      organization: {
        selected: null,
        stations: [],
        rules: [
          v => !!v || 'Organization is required'
        ]
      },
      table: {
        rows: [],
        settings: {
          height: 'auto',
          licenseKey: 'non-commercial-and-evaluation',
          // dropdown: true,
          contextMenu: ['remove_row', '---------', 'clear_column', '---------', 'undo', 'redo'],
          minRows: 0,
          fixedColumnsStart: 3,
          preventOverflow: 'horizontal',
          dataSchema: {
            status: '',
            filename: '',
            type: '',
            station_mode: '',
            station_value: '',
            datetime_column: '',
            time_column: '',
            timezone_mode: '',
            timezone_value: '',
            depth_mode: '',
            depth_value: '',
            depth_units: '',
            value_column: '',
            value_units: '',
            value_missing: '',
            flag_column: '',
            accuracy: '',
            sop_bath: '',
            reviewed: ''
          }
        },
        columns: [
          {
            prop: 'status',
            label: ' ',
            width: '30px',
            renderer: function (instance, td, row, col, prop, value, cellProperties) {
              td.className = 'htCenter'
              if (value === 'SUCCESS') {
                td.innerText = '✓'
                td.style.color = 'white'
                td.style.background = '#4caf50'
              } else if (value === 'FAILED') {
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
                td.style.background = '#1976d2'
              } else {
                td.innerText = ''
                td.style.background = '#EEE'
              }
            },
            readOnly: true
          },
          {
            prop: 'row',
            label: 'Row',
            readOnly: true,
            width: '40px',
            renderer: function (instance, td, row, col, prop, value, cellProperties) {
              td.className = 'htRight'
              td.innerText = value
            }
          },
          {
            prop: 'filename',
            label: 'Filename',
            allowEmpty: false,
            readOnly: true
          },
          {
            prop: 'type',
            label: 'File Type',
            allowEmpty: false,
            rule: `'File Type' must be one of: [${joinStrings(fileTypeOptions.map(d => d.value))}]`,
            type: 'dropdown',
            source: fileTypeOptions.map(d => d.value),
            width: '120px'
          },
          {
            prop: 'station_mode',
            label: 'Station Mode',
            allowEmpty: false,
            rule: `'Station Mode' must be one of: [${joinStrings(stationModes)}]`,
            type: 'dropdown',
            source: stationModes
          },
          {
            prop: 'station_value',
            label: 'Station Value',
            allowEmpty: false,
            rule: "'Station Value' is required"
          },
          {
            prop: 'datetime_column',
            label: 'Datetime/Date Column',
            allowEmpty: false,
            rule: "'Datetime/Date Column' is required"
          },
          {
            prop: 'time_column',
            label: 'Time Column'
          },
          {
            prop: 'timezone_mode',
            label: 'Timezone Mode',
            allowEmpty: false,
            rule: `'Timezone Mode' must be one of: [${joinStrings(timezoneModes)}]`,
            type: 'dropdown',
            source: timezoneModes
          },
          {
            prop: 'timezone_value',
            label: 'Timezone Value'
          },
          {
            prop: 'value_column',
            label: 'Temperature Column',
            allowEmpty: false,
            rule: "'Temperature Column' is required"
          },
          {
            prop: 'value_units',
            label: 'Temperature Units',
            allowEmpty: false,
            rule: `'Temperature Units' must be one of: [${joinStrings(temperatureUnitsOptions.map(d => d.value))}]`,
            type: 'dropdown',
            source: temperatureUnitsOptions.map(d => d.value)
          },
          {
            prop: 'value_missing',
            label: 'Missing Values'
          },
          {
            prop: 'flag_column',
            label: 'Flag Column'
          },
          {
            prop: 'depth_mode',
            label: 'Depth Mode',
            type: 'dropdown',
            source: depthModes
          },
          {
            prop: 'depth_value',
            label: 'Depth Value'
          },
          {
            prop: 'depth_units',
            label: 'Depth Units',
            rule: `'Depth Units' must be one of: [${joinStrings(depthUnitsOptions.map(d => d.value))}]`,
            type: 'dropdown',
            source: depthUnitsOptions.map(d => d.value)
          },
          {
            prop: 'accuracy',
            label: 'Sensor Accuracy',
            rule: `'Sensor Accuracy' must be one of: [${joinStrings(sensorAccuracyOptions.map(d => d.value))}]`,
            type: 'dropdown',
            source: sensorAccuracyOptions.map(d => d.value)
          },
          {
            prop: 'sop_bath',
            label: 'SOP Bath',
            rule: `'SOP Bath' must be one of: [${joinStrings(booleanOptions)}]`,
            type: 'dropdown',
            source: booleanOptions
          },
          {
            prop: 'reviewed',
            label: 'Reviewed',
            rule: `'Reviewed' must be one of: [${joinStrings(booleanOptions)}]`,
            type: 'dropdown',
            source: booleanOptions
          }
        ],
        invalidCells: [],
        maxInvalidCellErrors: 3
      }
    }
  },
  computed: {
    ...mapGetters({
      organizations: 'manage/organizations',
      defaultOrganization: 'manage/organization'
    }),
    failedFiles () {
      const copy = this.table.rows.slice()
      copy.forEach((d, i) => {
        d.$row = i
      })
      return copy.filter(d => d.status === 'FAILED')
    },
    savedFiles () {
      const copy = this.table.rows.slice()
      copy.forEach((d, i) => {
        d.$row = i
      })
      return copy.filter(d => d.status === 'SUCCESS')
    }
  },
  watch: {
    defaultOrganization () {
      this.setDefaultOrganization()
    },
    'organization.selected' () {
      this.fetchStations()
    }
  },
  async mounted () {
    Handsontable.hooks.add('afterValidate', this.afterValidate, this.$refs.hot.hotInstance)
    Handsontable.hooks.add('afterChange', this.afterChange, this.$refs.hot.hotInstance)
    this.setDefaultOrganization()
  },
  beforeDestroy () {
    Handsontable.hooks.remove('afterValidate', this.afterValidate, this.$refs.hot.hotInstance)
    Handsontable.hooks.remove('afterChange', this.afterChange, this.$refs.hot.hotInstance)
  },
  methods: {
    setDefaultOrganization () {
      this.organization.selected = this.defaultOrganization ? this.defaultOrganization : null
    },
    async fetchStations () {
      if (!this.organization.selected) {
        this.organization.stations = []
        return
      }
      try {
        const response = await this.$http.restricted.get(`/organizations/${this.organization.selected.id}/stations`)
        this.organization.stations = response.data
        this.renderHot()
      } catch (err) {
        this.error = this.$errorMessage(err)
      }
    },
    selectFiles () {
      this.initTable()
    },
    initTable () {
      this.table.invalidCells = []
      this.error = null
      this.table.rows.splice(0, this.table.rows.length)

      this.files.selected.forEach((d, i) => {
        this.table.rows.push({
          row: i + 1,
          filename: d.name
        })
      })
      console.log(this.table.rows)
      setTimeout(() => this.renderHot(), 1000)
    },
    afterValidate (isValid, value, row, prop) {
      if (!isValid) {
        if (!this.table.invalidCells.find(d => d.row === row && d.prop === prop)) {
          this.table.invalidCells.unshift({ value, row, prop, column: this.table.columns.find(d => d.prop === prop) })
        }
      }
    },
    afterChange (changes, source) {
      // if (source === 'updateData') return
      // this.validateSync()
    },
    validateSync () {
      this.table.invalidCells = []
      this.$refs.hot.hotInstance.validateCells()
    },
    validateCells () {
      this.table.invalidCells = []
      return new Promise((resolve, reject) => {
        this.$refs.hot.hotInstance.validateCells((valid) => {
          if (valid) {
            return resolve(true)
          } else {
            return reject(new Error('Table contains validation errors'))
          }
        })
      })
    },
    findColumnIndex (prop) {
      return this.table.columns.findIndex(d => d.prop === prop)
    },
    async validateRows () {
      const hot = this.$refs.hot.hotInstance
      const stationCodes = this.organization.stations.map(d => d.code)
      for (let i = 0; i < this.table.rows.length; i++) {
        const row = this.table.rows[i]
        row.status = 'VALIDATING'
        row.errors = []
        this.message = `Validating: ${row.filename}`
        this.renderHot()
        try {
          const parsed = await parseCsvFile(this.files.selected[i])
          const fields = parsed.meta.fields

          if (row.station_mode === 'STATION' &&
              !stationCodes.includes(row.station_value)) {
            hot.setCellMeta(i, this.findColumnIndex('station_value'), 'valid', false)
            row.errors.push(`'Station Value' is not a valid station code (${row.station_value || 'missing'}). When 'Station Mode' = 'STATION', then 'Station Value' is required and must contain an existing station code for the selected organization. A list of existing stations can be downloaded below for reference.`)
          }
          if (row.station_mode === 'COLUMN' &&
              !fields.includes(row.station_value)) {
            hot.setCellMeta(i, this.findColumnIndex('station_value'), 'valid', false)
            row.errors.push(`'Station Value' is not a valid column name (${row.station_value || 'missing'}). When 'Station Mode'='COLUMN' then 'Station Value' must be one of: [${joinStrings(fields)}].`)
          }
          if (!fields.includes(row.datetime_column)) {
            hot.setCellMeta(i, this.findColumnIndex('datetime_column'), 'valid', false)
            row.errors.push(`'Datetime/Date Column' is not a valid column name (${row.datetime_column || 'missing'}). Must be one of: [${joinStrings(fields)}].`)
          }
          if (row.time_column && !fields.includes(row.time_column)) {
            hot.setCellMeta(i, this.findColumnIndex('time_column'), 'valid', false)
            row.errors.push(`'Time Column' is not a valid column name (${row.time_column || 'missing'}). Must be one of: [${joinStrings(fields)}].`)
          }
          if (row.timezone_mode === 'UTCOFFSET' &&
              !utcOffsetOptions.map(d => d.value.toString()).includes(row.timezone_value)) {
            hot.setCellMeta(i, this.findColumnIndex('timezone_value'), 'valid', false)
            row.errors.push(`'Timezone Value' is not a valid UTC offset (${row.timezone_value || 'missing'}). When 'Timezone Mode'='UTCOFFSET' then 'Timezone Value' must be one of: [${joinStrings(utcOffsetOptions.map(d => d.value.toString()))}])`)
          }
          if (row.timezone_mode === 'COLUMN' &&
              !fields.includes(row.timezone_value)) {
            hot.setCellMeta(i, this.findColumnIndex('timezone_value'), 'valid', false)
            row.errors.push(`'Timezone Value' is not a valid column name(${row.timezone_value || 'missing'}). When 'Timezone Mode'='COLUMN' then 'Timezone Value' must be one of: [${joinStrings(fields)}])`)
          }
          if (row.depth_mode === 'COLUMN' &&
              !fields.includes(row.depth_value)) {
            hot.setCellMeta(i, this.findColumnIndex('depth_value'), 'valid', false)
            row.errors.push(`'Depth Value' is not a valid column name(${row.depth_value || 'missing'}). When 'Depth Mode'='COLUMN' then 'Depth Value' must be one of: [${joinStrings(fields)}])`)
          }
          if (row.depth_mode === 'VALUE' &&
              !isFinite(row.depth_value)) {
            hot.setCellMeta(i, this.findColumnIndex('depth_value'), 'valid', false)
            row.errors.push(`'Depth Value' is not a valid number (${row.depth_value || 'missing'}). When 'Depth Mode'='VALUE' then 'Depth Value' must be numeric.`)
          }
          if (row.depth_mode === 'CATEGORY' &&
              !depthCategoryOptions.map(d => d.value).includes(row.depth_value)) {
            hot.setCellMeta(i, this.findColumnIndex('depth_value'), 'valid', false)
            row.errors.push(`'Depth Value' is not a valid depth category (${row.depth_value || 'missing'}). When 'Depth Mode'='CATEGORY' then 'Depth Value' must be one of: [${joinStrings(depthCategoryOptions.map(d => d.value))}].`)
          }
          if ((row.depth_mode === 'COLUMN' || row.depth_mode === 'VALUE') &&
              !depthUnitsOptions.map(d => d.value).includes(row.depth_units)) {
            hot.setCellMeta(i, this.findColumnIndex('depth_units'), 'valid', false)
            row.errors.push(`'Depth Units' is not a valid depth unit (${row.depth_units || 'missing'}). When 'Depth Mode'='COLUMN' or 'VALUE then 'Depth Units' must be one of: [${joinStrings(depthCategoryOptions.map(d => d.value))}].`)
          }
          if (row.type === 'PROFILES' && row.depth_mode !== 'COLUMN') {
            hot.setCellMeta(i, this.findColumnIndex('depth_mode'), 'valid', false)
            row.errors.push("'Depth Mode' must be 'COLUMN' when 'File Type'='PROFILES'")
          }
          if (!fields.includes(row.value_column)) {
            hot.setCellMeta(i, this.findColumnIndex('value_column'), 'valid', false)
            row.errors.push(`'Temperature Column' is not a valid column (${row.value_column || 'missing'}). Must be one of: [${joinStrings(fields)}].`)
          }
          if (row.flag_column && !fields.includes(row.flag_column)) {
            hot.setCellMeta(i, this.findColumnIndex('flag_column'), 'valid', false)
            row.errors.push(`'Flag Column' is not a valid column (${row.flag_column || 'missing'}). Must be one of: [${joinStrings(fields)}].`)
          }
        } catch (err) {
          console.error(err)
          row.status = 'FAILED'
          row.errors = [this.$errorMessage(err)]
        }
        if (row.errors.length > 0) {
          row.status = 'FAILED'
        } else {
          row.status = 'READY'
        }
        this.renderHot()
      }
      this.message = null
      // to force failedFiles to update
      this.table.rows = this.table.rows.slice()
      // this.loading = false
      if (this.table.rows.some(d => d.status === 'FAILED')) {
        throw new Error('Failed to validate all files')
      }
    },
    async uploadFiles () {
      // const hot = this.$refs.hot.hotInstance
      for (let i = 0; i < this.table.rows.length; i++) {
        const row = this.table.rows[i]
        if (row.status === 'SUCCESS') continue

        const file = this.files.selected[i]
        const config = this.createConfig(row)
        const organizationId = this.organization.selected.id

        row.status = 'UPLOADING'
        this.renderHot()

        try {
          this.message = `Uploading: ${file.name}`
          await uploader(file, config, organizationId)
          row.status = 'SUCCESS'
        } catch (err) {
          console.log('uploader failed', err)
          row.status = 'FAILED'
          row.error = err.toString() || 'Unknown error'
        } finally {
          this.message = null
        }
        this.renderHot()
      }
      // to force failedFiles to update
      this.table.rows = this.table.rows.slice()
    },
    renderHot () {
      this.$refs.hot && this.$refs.hot.hotInstance.render()
    },
    createConfig (row) {
      const config = {
        station: {
          mode: row.station_mode
        },
        depth: {
          mode: row.depth_mode
        },
        timestamp: {
          columns: [row.datetime_column],
          timezone: {
            mode: row.timezone_mode
          }
        },
        value: {
          column: row.value_column,
          units: row.value_units,
          missing: row.value_missing ? row.value_missing.split(',') : [],
          flagColumn: row.flag_column ? row.flag_column : null
        },
        meta: {}
      }

      switch (row.type) {
        case 'CONTINUOUS':
          config.type = 'SERIES'
          config.meta.interval = 'CONTINUOUS'
          break
        case 'DISCRETE':
          config.type = 'SERIES'
          config.meta.interval = 'DISCRETE'
          break
        case 'PROFILES':
          config.type = 'PROFILES'
          break
      }

      switch (row.station_mode) {
        case 'STATION':
          config.station.stationId = this.organization.stations.find(d => d.code === row.station_value).id
          break
        case 'COLUMN':
          config.station.column = row.station_value
          break
      }

      if (row.time_column) {
        config.timestamp.columns.push(row.time_column)
      }

      switch (row.timezone_mode) {
        case 'UTCOFFSET':
          config.timestamp.timezone.utcOffset = parseInt(row.timezone_value)
          break
        case 'COLUMN':
          config.timestamp.timezone.column = row.timezone_value
          break
      }

      switch (row.depth_mode) {
        case 'COLUMN':
          config.depth.column = row.depth_value
          config.depth.units = row.depth_units
          if (config.type === 'SERIES') {
            config.depth.category = 'VARYING'
          }
          break
        case 'VALUE':
          config.depth.value = row.depth_value
          config.depth.units = row.depth_units
          break
        case 'CATEGORY':
          config.depth.category = row.depth_value
          break
        default:
          config.depth.mode = null
      }

      config.meta.sop_bath = parseBooleanOption(row.sop_bath)
      config.meta.accuracy = row.accuracy ? row.accuracy : null
      config.meta.reviewed = row.reviewed ? parseBooleanOption(row.reviewed) : false

      return config
    },
    // async submit () {
    //   console.log(this.createConfig(this.table.rows[0]))
    // },
    async submit () {
      this.error = null

      if (!this.$refs.form.validate()) {
        // organization or files not selected
        this.error = 'Check form errors above'
        return
      }

      try {
        await this.validateCells()
      } catch (err) {
        return
      }

      this.table.rows.forEach(d => {
        d.status = d.status === 'FAILED' ? null : d.status
        d.errors = []
      })

      this.loading = true
      try {
        await this.validateRows()
      } catch (err) {
        // this.error = this.$errorMessage(err)
        this.loading = false
        return this.renderHot()
      }

      try {
        console.log('uploading...')
        await this.uploadFiles()
      } catch (err) {
        console.log(err)
        this.error = this.$errorMessage(err)
      }

      this.loading = false

      this.renderHot()

      if (!this.table.rows.some(d => d.status !== 'SUCCESS')) {
        evt.$emit('notify', 'Files have been uploaded', 'success')
        this.$store.dispatch('manage/setOrganizationById', this.organization.selected.id)
        this.$router.push({
          name: 'manageFiles'
        })
      }
    },
    downloadStationsFile () {
      this.$download.csv(this.organization.stations, 'stations.csv')
    },
    removeSavedFiles () {
      this.table.rows = this.table.rows.filter(d => d.status !== 'SUCCESS')
    }
  }
}
</script>

<style>

</style>
