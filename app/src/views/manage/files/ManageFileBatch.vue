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

            <v-card-text>
              <v-form ref="form" @submit.prevent="submit" :disabled="loading">
                <v-row>
                  <v-col cols="12">
                    <v-card class="pb-0">
                      <v-card-text class="pb-0">
                        <div>
                          <div class="text-h6 mb-2">Organization</div>
                          <p class="black--text">Select the organization to which these files will be saved.</p>
                          <v-row>
                            <v-col cols="12" md="6" lg="4">
                              <v-select
                                v-model="organization.selected"
                                :items="organizations"
                                :rules="organization.rules"
                                item-text="code"
                                item-value="id"
                                label="Organization"
                                validate-on-blur
                                outlined
                              ></v-select>
                            </v-col>
                          </v-row>
                        </div>

                        <div v-if="organization.selected">
                          <div class="text-h6 mb-2">Select Files</div>
                          <p class="black--text">Select the data files. Each file must be in comma-separated value (CSV) format and only contain data for a single station.</p>
                          <v-row>
                            <v-col cols="12" md="6" lg="4">
                              <v-file-input
                                v-model="files.selected"
                                :rules="files.rules"
                                label="Select data files"
                                truncate-length="200"
                                @change="selectFiles"
                                ref="filesInput"
                                outlined
                                multiple
                              >
                              </v-file-input>
                            </v-col>
                          </v-row>
                        </div>

                        <div v-show="table.rows.length > 0">
                          <v-divider class="mb-4"></v-divider>
                          <div class="text-h6 mb-2">Files Table</div>
                          <p class="black--text">Enter your files into the table below or copy &amp; paste from Excel. Instructions provided in the template below.</p>
                          <HotTable
                            :data="table.rows"
                            :rowHeaders="false"
                            :colHeaders="true"
                            :settings="table.settings"
                            ref="hot"
                          >
                            <HotColumn
                              v-for="col in table.columns"
                              :key="col.prop"
                              :data="col.prop"
                              :title="`${col.label}${col.required ? '*' : ''}`"
                              :validator="col.validator"
                              :editor="col.editor"
                              :select-options="col.options"
                              :read-only="col.readOnly"
                              :renderer="col.renderer"
                              :width="col.width"
                              :type="col.type"
                            ></HotColumn>
                          </HotTable>
                          <p>
                            * = Required column. Some columns contain dropdown menus to select allowed values.<br>
                          </p>
                          <v-row>
                            <v-col cols="12">
                              <p class="black--text">Need help getting started? Download the Excel template and follow the instructions on the README sheet.</p>
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
                                @click="downloadFile"
                                class="mb-4 ml-4"
                              ><v-icon left>mdi-download</v-icon> Download Stations</v-btn>
                              <p class="black--text">After you have filled out the table in the template, copy and paste your files from Excel into the table above.</p>
                            </v-col>
                          </v-row>
                        </div>

                        <Alert
                          type="error"
                          v-for="(d, i) in table.invalidCells.slice(0, table.maxInvalidCellErrors)"
                          :key="i"
                          :title="`Invalid ${d.column.label} (${ d.value || 'null' }) in row ${ d.row + 1 }`"
                        >
                          {{ d.column.rule }}
                        </Alert>

                        <p v-if="table.invalidCells.length > table.maxInvalidCellErrors" class="body-1">
                          and {{ table.invalidCells.length - table.maxInvalidCellErrors }} more...
                        </p>

                        <Alert type="error" v-for="(file, i) in failedFiles" :key="i" :title="`Failed to Save File (Row ${i + 1})`">
                          {{ file.error }}
                        </Alert>

                        <Alert
                          type="info"
                          :title="message"
                          v-if="message"
                        >
                        </Alert>
                      </v-card-text>

                      <v-divider></v-divider>
                      <v-card-actions class="py-4 pl-4">
                        <v-btn type="submit" color="primary" class="mr-4" :loading="loading" :disabled="this.table.rows.length === 0">Submit</v-btn>
                        <v-btn color="default" text @click="initTable" :disabled="loading || this.table.rows.length === 0">Reset Table</v-btn>

                        <v-spacer></v-spacer>

                        <v-btn color="default" text @click="cancel">Cancel</v-btn>
                      </v-card-actions>

                      <div v-if="error" class="pb-1">
                        <v-divider class="mb-4"></v-divider>

                        <Alert type="error" title="Invalid Form" class="ma-4">{{ error }}</Alert>
                      </div>
                    </v-card>
                  </v-col>
                </v-row>
              </v-form>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
/* eslint-disable standard/no-callback-literal */
import Handsontable from 'handsontable'
import { mapGetters } from 'vuex'

import evt from '@/events'
import { parseCsvFile } from '@/lib/utils'
import uploader from '@/lib/uploader'
import { fileTypeOptions, utcOffsetOptions, temperatureUnitsOptions, depthCategoryOptions, depthUnitsOptions } from '@/lib/constants'

export default {
  name: 'ManageFileUpload',
  data () {
    return {
      debug: true,
      error: null,
      loading: false,
      message: null,
      files: {
        selected: null,
        rules: [
          v => {
            if (!v) return true
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
          dropdown: true,
          contextMenu: ['clear_column', '---------', 'undo', 'redo'],
          minRows: 0,
          stretchH: 'all',
          preventOverflow: 'horizontal',
          fixedColumnsStart: 2,
          dataSchema: {
            status: '',
            filename: '',
            station_code: '',
            timestamp_column: '',
            value_column: '',
            value_units: ''
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
            prop: 'filename',
            label: 'Filename',
            required: true,
            readOnly: true
          },
          {
            prop: 'type',
            label: 'File Type',
            required: true,
            validator: function (value, callback) {
              callback(fileTypeOptions.map(d => d.value).includes(value))
            },
            rule: `File type must be one of: [${fileTypeOptions.map(d => `'${d.value}'`).join(', ')}]`,
            editor: 'select',
            options: fileTypeOptions.map(d => d.value)
          },
          {
            prop: 'station_code',
            label: 'Station Code',
            required: true,
            validator: (value, callback) => {
              callback(this.organization.stations.map(d => d.code).includes(value))
            },
            rule: 'Station code not found for selected organization. Download stations table to see list of available codes.'
          },
          {
            prop: 'timestamp_column',
            label: 'Timestamp Column',
            required: true,
            validator: function (value, callback) {
              callback(!!value)
            },
            rule: 'Timestamp column is required'
          },
          {
            prop: 'timestamp_utcoffset',
            label: 'UTC Offset',
            required: true,
            validator: function (value, callback) {
              callback(utcOffsetOptions.map(d => d.value.toString()).includes(value))
            },
            rule: `UTC offset must be one of: [${utcOffsetOptions.map(d => `'${d.value}'`).join(', ')}]`,
            editor: 'select',
            options: utcOffsetOptions.map(d => d.value.toString())
          },
          {
            prop: 'value_column',
            label: 'Temperature Column',
            required: true,
            validator: function (value, callback) {
              callback(!!value)
            },
            rule: 'Temperature column is required'
          },
          {
            prop: 'value_units',
            label: 'Temperature Units',
            required: true,
            validator: function (value, callback) {
              callback(temperatureUnitsOptions.map(d => d.value).includes(value))
            },
            rule: `Temperature units must be one of: [${temperatureUnitsOptions.map(d => `'${d.value}'`).join(', ')}]`,
            editor: 'select',
            options: temperatureUnitsOptions.map(d => d.value)
          },
          {
            prop: 'depth_category',
            label: 'Depth Category',
            validator: function (value, callback) {
              callback(!value || depthCategoryOptions.map(d => d.value).includes(value))
            },
            rule: `Depth category must be one of: [${depthCategoryOptions.map(d => `'${d.value}'`).join(', ')}]`,
            editor: 'select',
            options: depthCategoryOptions.map(d => d.value)
          },
          {
            prop: 'depth_value',
            label: 'Depth Value',
            type: 'numeric',
            rule: 'Initial depth must be a number'
          },
          {
            prop: 'depth_column',
            label: 'Depth Column'
          },
          {
            prop: 'depth_units',
            label: 'Depth Units',
            validator: (value, callback) => {
              callback(!value || depthUnitsOptions.map(d => d.value).includes(value))
            },
            rule: `Depth units must be one of: [${depthUnitsOptions.map(d => `'${d.value}'`).join(', ')}]`,
            editor: 'select',
            options: depthUnitsOptions.map(d => d.value)
          }
        ],
        invalidCells: [],
        maxInvalidCellErrors: 5
      }
    }
  },
  computed: {
    ...mapGetters({
      organizations: 'manage/organizations',
      defaultOrganization: 'manage/organization'
    }),
    failedFiles () {
      if (!this.table.rows) return []
      return this.table.rows.filter(d => d.status === 'FAILED')
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
      if (this.organizations.length === 1) {
        this.organization.selected = this.defaultOrganization ? this.defaultOrganization.id : null
      }
    },
    async fetchStations () {
      if (!this.organization.selected) {
        this.organization.stations = []
        return
      }
      try {
        const response = await this.$http.restricted.get(`/organizations/${this.organization.selected}/stations`)
        this.organization.stations = response.data
      } catch (err) {
        this.err = this.$errorMessage(err)
      }
    },
    selectFiles () {
      this.initTable()
    },
    afterValidate (isValid, value, row, prop) {
      if (!isValid) {
        if (!this.table.invalidCells.find(d => d.row === row && d.prop === prop)) {
          this.table.invalidCells.unshift({ value, row, prop, column: this.table.columns.find(d => d.prop === prop) })
        }
      }
    },
    afterChange (changes, source) {
      if (source === 'updateData') return
      this.validateSync()
    },
    validateSync (changes, source) {
      this.table.invalidCells = []
      this.$refs.hot.hotInstance.validateCells()
    },
    validate () {
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
    async validateFiles () {
      const hot = this.$refs.hot.hotInstance
      for (let i = 0; i < this.table.rows.length; i++) {
        const row = this.table.rows[i]
        row.status = 'VALIDATING'
        this.message = `Validating: ${row.filename}`
        this.renderHot()
        try {
          const parsed = await parseCsvFile(this.files.selected[i])
          const fields = parsed.meta.fields

          if (!fields.includes(row.timestamp_column)) {
            hot.setCellMeta(i, this.table.columns.findIndex(d => d.prop === 'timestamp_column'), 'valid', false)
            row.status = 'FAILED'
            row.error = `Timestamp column (${row.timestamp_column || 'missing'}) not found in file headers ([${fields.map(d => `'${d}'`).join(', ')}])`
            continue
          }
          if (!fields.includes(row.value_column)) {
            hot.setCellMeta(i, this.table.columns.findIndex(d => d.prop === 'value_column'), 'valid', false)
            row.status = 'FAILED'
            row.error = `Temperature column (${row.value_column || 'missing'}) not found in file headers ([${fields.map(d => `'${d}'`).join(', ')}])`
            continue
          }
        } catch (err) {
          row.status = 'FAILED'
          row.error = 'Failed to read file'
        }
        row.status = 'READY'
        this.message = null
        this.renderHot()
      }
      // to force failedFiles to update
      this.table.rows = this.table.rows.slice()
      this.loading = false
    },
    async uploadFiles () {
      // const hot = this.$refs.hot.hotInstance
      for (let i = 0; i < this.table.rows.length; i++) {
        const row = this.table.rows[i]
        if (row.status === 'SUCCESS') continue

        const file = this.files.selected[i]
        const config = this.createConfig(row)
        const organizationId = this.organization.selected

        row.status = 'UPLOADING'
        this.renderHot()

        try {
          this.message = `Uploading: ${file.name}`
          await uploader(file, config, organizationId)
          row.status = 'SUCCESS'
        } catch (err) {
          console.log('uploader filed', err)
          row.status = 'FAILED'
          row.error = err.toString() || 'Unknown error'
        } finally {
          this.message = null
        }
        this.renderHot()
      }
      // to force failedFiles to update
      this.table.rows = this.table.rows.slice()
      this.loading = false
    },
    initTable () {
      this.invalidCells = []
      this.error = null
      this.table.rows.splice(0, this.table.rows.length)

      this.files.selected.forEach(d => {
        this.table.rows.push({
          filename: d.name
          // type: 'SERIES',
          // station_code: 'TEST_001',
          // timestamp_column: 'datetime',
          // timestamp_utcoffset: '-9',
          // value_column: 'temp_c',
          // value_units: 'C'
        })
      })
      this.renderHot()
    },
    renderHot () {
      this.$refs.hot && this.$refs.hot.hotInstance.render()
    },
    createConfig (row) {
      const station = this.organization.stations.find(d => d.code === row.station_code)
      if (!station) {
        throw new Error(`Station code (${row.station_code}) not found`)
      }
      const config = {
        type: row.type,
        station: {
          mode: 'STATION',
          stationId: station.id
        },
        depth: {},
        timestamp: {
          columns: [row.timestamp_column], // todo time
          timezone: {
            mode: 'UTCOFFSET',
            utcOffset: row.timestamp_utcoffset
          }
        },
        value: {
          column: row.value_column,
          units: row.value_units,
          missing: [] // TODO row.value_missing.split(',')
        },
        meta: {
          interval: 'CONTINUOUS'
        }
      }

      if (row.depth_category) {
        config.depth.mode = 'CATEGORY'
        config.depth.category = row.depth_category
      } else if (row.depth_value) {
        config.depth.mode = 'VALUE'
        config.depth.value = row.depth_value
        config.depth.units = row.depth_units
      } else if (row.depth_column) {
        config.depth.mode = 'COLUMN'
        config.depth.category = 'VARYING'
        config.depth.column = row.depth_column
        config.depth.units = row.depth_units
      } else {
        config.depth.mode = 'UNKNOWN'
      }

      return config
    },
    async submit () {
      this.error = null

      if (!this.$refs.form.validate()) {
        this.error = 'Check form errors above'
        return
      }

      try {
        await this.validate()
      } catch (err) {
        return
      }

      if (this.files.selected.length === 0) {
        this.error = 'No files selected'
      } else if (this.files.selected.length !== this.table.rows.length) {
        this.error = `Number of rows (${this.table.rows.length}) does not match number of selected files (${this.files.selected.length}). Remove any empty rows (right-click > Remove Row), or click 'Reset Table' to start again.`
      }

      this.table.rows.forEach(d => {
        d.status = d.status === 'FAILED' ? null : d.status
        d.error = null
      })

      this.loading = true
      try {
        await this.validateFiles()
      } catch (err) {
        this.error = 'Failed to validate files'
        return this.renderHot()
      }

      try {
        console.log('uploading...')
        await this.uploadFiles()
      } catch (err) {
        console.log(err)
        this.err = this.$errorMessage(err)
      }

      this.renderHot()

      if (!this.table.rows.find(d => d.status !== 'SUCCESS')) {
        evt.$emit('notify', 'Files have been uploaded', 'success')
        this.$store.dispatch('manage/setOrganizationById', this.organization.selected)
        this.$router.push({
          name: 'manageFiles'
        })
      }
    },
    downloadFile () {
      this.$saveFile.csv(this.organization.stations, 'stations.csv', ['code', 'description', 'waterbody_name', 'waterbody_type', 'latitude', 'longitude'])
    },
    cancel () {
      this.$router.push({ name: 'manageFiles' })
    }
  }
}
</script>

<style>

</style>
