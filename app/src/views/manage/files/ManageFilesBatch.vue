<template>
  <v-card elevation="2">
    <v-toolbar flat dense>
      <v-toolbar-title>
        <span class="text-h6">Batch File Upload</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text small @click="$router.push({ name: 'manageFiles' })">
        <v-icon small left>mdi-chevron-left</v-icon> Back to Files
      </v-btn>
    </v-toolbar>
    <v-divider></v-divider>

    <v-form ref="form" @submit.prevent="submit" :disabled="loading">
      <v-card-text>
        <div>
          <div class="font-weight-bold text-subtitle-1" @change="initTable">Dataset Type</div>
          <p class="mb-2">What kind of data do you want to upload? All files must contain the same type of data.</p>
          <ul class="mb-4">
            <li><strong>Timeseries</strong> reflect temperature <strong>changes over time</strong> at a fixed location and depth.</li>
            <li><strong>Vertical profiles</strong> reflect temperature <strong>changes over depth</strong> at a fixed location and at a single point in time.</li>
          </ul>
          <v-btn-toggle v-model="files.type" mandatory class="mb-4">
            <v-btn value="SERIES">
              <v-icon left>mdi-chart-line-variant</v-icon>
              Timeseries
            </v-btn>
            <v-btn value="PROFILES">
              <v-icon left>mdi-arrow-expand-down</v-icon>
              Vertical Profiles
            </v-btn>
          </v-btn-toggle>
        </div>
        <v-divider class="my-4"></v-divider>
        <div>
          <div class="font-weight-bold text-subtitle-1">Select Files</div>
          <p class="black--text">Select one or more data files. Each file must be in comma-separated value (CSV) format.</p>
          <v-file-input
            ref="filesInput"
            v-model="files.selected"
            :rules="files.rules"
            placeholder="Select data files"
            truncate-length="200"
            prepend-icon="mdi-file-delimited-outline"
            @change="initTable"
            outlined
            multiple
            validate-on-blur
          >
          </v-file-input>
        </div>

        <div v-show="table.rows.length > 0">
          <v-divider class="mb-4"></v-divider>

          <div class="text-h6 mb-2">Files Table</div>

          <p class="black--text"><strong>Need help getting started?</strong> Download the Excel template and follow the instructions on the README sheet. You can also download a list of existing stations for the selected Organization for reference.</p>
          <v-btn
            color="primary"
            outlined
            bloc
            href="static/AKTEMP-files-template.xlsx"
            download
            class="mb-4"
          ><v-icon left>mdi-download</v-icon> Download Template</v-btn>
          <v-btn
            color="primary"
            outlined
            bloc
            class="ml-4 mb-4"
            @click="downloadStations"
          ><v-icon left>mdi-download</v-icon> Download Stations</v-btn>
          <p class="black--text">After you have filled out the table in the template, copy and paste the cells from Excel into the table below (excluding the header row).</p>
          <Alert type="warning" title="To Do">
            New features need to be explained in template
            <ul>
              <li>Columns can be specified by index (number) as well as name</li>
              <li>Date/time format can be left blank and AKTEMP will attempt to guess. If this fails, it will throw an error and ask the user to specify the token string.</li>
            </ul>
          </Alert>

          <!-- https://github.com/vuejs/devtools/issues/1947#issuecomment-1299134339 -->
          <HotTable
            ref="hotSeries"
            :data="table.rows"
            :colHeaders="true"
            :settings="table.settings"
            class="elevation-2"
            class-name=""
            v-show="files.type === 'SERIES'"
          >
            <HotColumn
              v-for="col in seriesColumns"
              :key="col.prop"
              :data="col.prop"
              :title="col.label"
              :settings="col"
            ></HotColumn>
          </HotTable>
          <HotTable
            ref="hotProfiles"
            :data="table.rows"
            :colHeaders="true"
            :settings="table.settings"
            class="elevation-2"
            class-name=""
            v-show="files.type === 'PROFILES'"
          >
            <HotColumn
              v-for="col in profilesColumns"
              :key="col.prop"
              :data="col.prop"
              :title="col.label"
              :settings="col"
            ></HotColumn>
          </HotTable>
          <div class="text-caption mt-2">Status: {{ message || 'Ready' }}</div>
          <div class="text--secondary caption mb-4">
            * = Always Required, † = Conditionally Required. Ctrl+c/Ctrl+v to copy/paste. Right-click to undo/redo.
          </div>

          <v-card v-if="table.selected">
            <v-toolbar color="grey lighten-3" flat dense>
              <div class="text-overline black--text">Selected File</div>
            </v-toolbar>
            <v-divider></v-divider>
            <v-card-text class="black--text">
              <table class="mb-4">
                <tbody>
                  <tr>
                    <td class="text-right pr-2">Row:</td>
                    <td class="font-weight-bold">{{ table.selected.row + 1 }}</td>
                  </tr>
                  <tr>
                    <td class="text-right pr-2">Filename:</td>
                    <td class="font-weight-bold">
                      {{ table.selected.filename }}
                    </td>
                  </tr>
                  <tr>
                    <td class="text-right pr-2">Status:</td>
                    <td class="font-weight-bold">
                      {{ table.selected.status }}
                    </td>
                  </tr>
                  <tr v-if="table.selected.parsed">
                    <td class="text-right pr-2"># Rows:</td>
                    <td class="font-weight-bold">{{ table.selected.parsed.data.length.toLocaleString() }}</td>
                  </tr>
                  <tr v-if="table.selected.parsed">
                    <td class="text-right pr-2"># Columns:</td>
                    <td class="font-weight-bold">{{ table.selected.parsed.meta.fields.length.toLocaleString() }}</td>
                  </tr>
                </tbody>
              </table>
              <!-- SUCCESS -->
              <Alert
                v-if="table.selected.status === 'SUCCESS'"
                type="success"
                :title="`File Uploaded on Row ${table.selected.row + 1}`"
              >
                <table class="mt-2">
                  <tbody>
                    <tr>
                      <td class="text-right pr-2">Row:</td>
                      <td class="font-weight-bold">{{ table.selected.row + 1 }}</td>
                    </tr>
                    <tr>
                      <td class="text-right pr-2">Filename:</td>
                      <td class="font-weight-bold">
                        <router-link :to="{
                          name: 'manageFile',
                          params: {
                            orgnizationId: this.$route.params.organizationId,
                            fileId: table.selected.file.id
                          }
                        }">
                          {{ table.selected.filename }}
                        </router-link>
                      </td>
                    </tr>
                    <tr>
                      <td class="text-right pr-2"># Rows:</td>
                      <td class="font-weight-bold">{{ table.selected.n_rows === 0 || !!table.selected.n_rows ? table.selected.n_rows.toLocaleString() : '' }}</td>
                    </tr>
                    <tr>
                      <td class="text-right pr-2" style="vertical-align:top">Columns:</td>
                      <td class="font-weight-bold">
                        {{ table.selected.fields.map(d => `'${d}'`).join(', ') }}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <div class="mt-4">This file has been uploaded to the server and can be removed from the import table.</div>
              </Alert>
              <!-- INVALID -->
              <Alert
                v-else-if="table.selected.status === 'INVALID'"
                type="error"
                title="Validation Error(s)"
              >
                <p>Please fix the following error(s), then click Retry Validation to check if errors were addressed for this file. You can also click the Submit button at the bottom of the form to retry all files.</p>
                <ul>
                  <li v-for="(err, i) in table.selected.errors" :key="'err-' + i" class="mb-2">
                    <div v-html="err.message"></div>
                  </li>
                </ul>

                <div class="mt-4">
                  <v-btn color="primary" @click="validateRow(table.selected, table.selected.row)">
                    <v-icon left>mdi-refresh</v-icon> Retry Validation
                  </v-btn>
                </div>
              </Alert>
              <!-- FAILED -->
              <Alert
                v-else-if="table.selected.status === 'FAILED'"
                type="error"
                title="Server Error"
              >
                <p>This file passed the initial validation but was rejected by the server. Please fix the following error(s), then click Submit to try again.</p>
                <ul>
                  <li v-for="(err, i) in table.selected.errors" :key="'err-' + i" class="mb-2">
                    <div>{{ err.message }}</div>
                  </li>
                </ul>
              </Alert>

              <div v-if="table.selected.lines">
                <v-divider class="my-4"></v-divider>
                <div class="secondary--text caption">Raw File Contents (first 200 lines)</div>
                <div style="overflow:auto;max-height:400px;border:1px solid rgba(0, 0, 0, 0.12)">
                  <table class="text-monospace">
                    <tbody>
                      <tr v-for="(line, i) in table.selected.lines.slice(0,200)" :key="`line-${i}`">
                        <td class="px-2 text-right" style="border-right:1px solid rgba(0, 0, 0, 0.12)">{{ i + 1 }}</td>
                        <td style="white-space:nowrap">{{ line }}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </v-card-text>
          </v-card>

          <div v-if="table.failedCount > 0">
            <v-divider class="my-4"></v-divider>
            <Alert
              type="warning"
              title="Table Contains Failed or Invalid Files"
              class="mb-0 mt-4"
            >
              <p class="mb-0">
                {{ table.failedCount.toLocaleString() }} file(s) were invalid or failed to be uploaded to the server. Click on any row marked by <span style="color:white;background-color:#ff5252;width:6px">&nbsp;✕&nbsp;</span> for more details.
              </p>
              <div v-if="table.rows.length > table.failedCount" class="mt-4">
                <div>
                  Files marked by <span style="color:white;background-color:#4caf50;width:6px">&nbsp;✓&nbsp;</span> have been uploaded to the server and can be safely removed from the table above. Click the following button to remove them leaving only the files that failed.
                </div>
                <v-btn color="default" @click="removeUploadedFiles" class="mt-4">
                  <v-icon small left>mdi-close</v-icon> Remove Uploaded Files
                </v-btn>
              </div>
            </Alert>
          </div>
        </div>

        <div v-if="error">
          <v-divider class="mb-4"></v-divider>
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
          @click="clear"
          :disabled="loading || this.table.rows.length === 0"
        >Clear</v-btn>

        <v-spacer></v-spacer>

        <v-btn
          color="default"
          text
          @click="$router.push({ name: 'manageFiles' })"
        >Cancel</v-btn>
      </v-card-actions>
    </v-form>
  </v-card>
</template>

<script>
import Handsontable from 'handsontable'
import { mapGetters } from 'vuex'

import evt from '@/events'
import uploader from '@/lib/uploader'
import { getTimestampString, parseTimestampString, guessDatetimeFormat } from 'aktemp-utils/time'

const {
  intervalOptions,
  fileTimezoneOptions,
  depthCategoryOptions,
  temperatureUnitsOptions,
  sensorAccuracyOptions,
  depthUnitsOptions,
  booleanOptions
} = require('aktemp-utils/constants')

const {
  validateFileConfig
} = require('aktemp-utils/validators')

const { parseCsvFile, readLocalFile, splitLines } = require('@/lib/utils')

export default {
  name: 'ManageFilesBatch',
  data () {
    return {
      loading: false,
      error: null,
      message: null,

      files: {
        type: 'SERIES',
        selected: [],
        rules: [
          v => v.length > 0 || 'No files selected'
        ]
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
            prop: 'filename',
            label: 'Filename',
            allowEmpty: false,
            readOnly: true
          },
          {
            prop: 'file_skip',
            label: 'Skip Lines'
          },
          {
            prop: 'interval',
            label: 'Interval*',
            type: 'dropdown',
            strict: false,
            source: intervalOptions.map(d => d.value),
            width: '120px',
            excludeProfiles: true
          },
          {
            prop: 'station_code',
            label: 'Station Code†'
          },
          {
            prop: 'station_column',
            label: 'Station Column†'
          },
          {
            prop: 'datetime_column',
            label: 'Date/time Column*'
          },
          {
            prop: 'time_column',
            label: 'Time Column'
          },
          {
            prop: 'datetime_format',
            label: 'Date/time Format*'
          },
          {
            prop: 'timezone',
            label: 'Timezone*',
            type: 'dropdown',
            strict: false,
            source: fileTimezoneOptions.map(d => d.value)
          },
          {
            prop: 'timezone_column',
            label: 'Timezone Column†'
          },
          {
            prop: 'temperature_column',
            label: 'Temperature Column*'
          },
          {
            prop: 'temperature_units',
            label: 'Temperature Units*',
            type: 'dropdown',
            strict: false,
            source: temperatureUnitsOptions.map(d => d.value)
          },
          {
            prop: 'temperature_missing',
            label: 'Missing Values'
          },
          {
            prop: 'flag_column',
            label: 'Flag Column',
            excludeProfiles: true
          },
          {
            prop: 'depth_category',
            label: 'Depth Category',
            type: 'dropdown',
            strict: false,
            source: depthCategoryOptions.map(d => d.value),
            excludeProfiles: true
          },
          {
            prop: 'depth_value',
            label: 'Numeric Depth',
            excludeProfiles: true
          },
          {
            prop: 'depth_column',
            label: 'Depth Column†'
          },
          {
            prop: 'depth_units',
            label: 'Depth Units†',
            type: 'dropdown',
            strict: false,
            source: depthUnitsOptions.map(d => d.value)
          },
          {
            prop: 'accuracy',
            label: 'Sensor Accuracy',
            type: 'dropdown',
            strict: false,
            source: sensorAccuracyOptions.map(d => d.value)
          },
          {
            prop: 'sop_bath',
            label: 'SOP Bath',
            type: 'dropdown',
            strict: false,
            source: booleanOptions.map(d => d.value),
            excludeProfiles: true
          },
          {
            prop: 'reviewed',
            label: 'Reviewed',
            type: 'dropdown',
            strict: false,
            source: booleanOptions.map(d => d.value)
          }
        ],
        settings: {
          height: 270,
          renderAllRows: true,
          licenseKey: 'non-commercial-and-evaluation',
          contextMenu: ['clear_column', '---------', 'undo', 'redo'],
          minRows: 0,
          rowHeaders: true,
          rowHeaderWidth: 40,
          fixedColumnsStart: 2,
          manualColumnResize: true,
          preventOverflow: 'horizontal',
          dataSchema: {
            status: '',
            filename: '',
            file_skip: '',
            file_type: '',
            interval: '',
            station_code: '',
            station_column: '',
            datetime_column: '',
            time_column: '',
            timezone_mode: '',
            timezone_utcoffset: '',
            timezone_column: '',
            depth_category: '',
            depth_value: '',
            depth_units: '',
            depth_column: '',
            value_column: '',
            value_units: '',
            value_missing: '',
            flag_column: '',
            accuracy: '',
            sop_bath: '',
            reviewed: ''
          }
        }
      }
    }
  },
  computed: {
    ...mapGetters({
      organizations: 'manage/organizations',
      organization: 'manage/organization',
      stations: 'manage/stations'
    }),
    profilesColumns () {
      return this.table.columns.filter(d => !d.excludeProfiles)
    },
    seriesColumns () {
      return this.table.columns
    },
    hot () {
      if (!this.$refs) return null
      if (this.files.type === 'SERIES') {
        return this.$refs.hotSeries.hotInstance
      } else {
        return this.$refs.hotProfiles.hotInstance
      }
    }
  },
  async mounted () {
    Handsontable.hooks.add('afterSelection', this.afterSelection, this.$refs.hotSeries.hotInstance)
    Handsontable.hooks.add('afterSelection', this.afterSelection, this.$refs.hotProfiles.hotInstance)
  },
  beforeDestroy () {
    if (this.$refs.hot) {
      Handsontable.hooks.remove('afterSelection', this.afterSelection, this.$refs.hotSeries.hotInstance)
      Handsontable.hooks.remove('afterSelection', this.afterSelection, this.$refs.hotProfiles.hotInstance)
    }
  },
  methods: {
    afterSelection (row) {
      this.table.selected = this.table.rows[row]
    },
    renderHot () {
      this.hot && this.hot.render()
    },
    clear () {
      this.files.selected = []
      this.initTable()
    },
    async initTable () {
      this.error = null
      this.table.rows.splice(0, this.table.rows.length)
      this.table.selected = null

      for (let i = 0; i < this.files.selected.length; i++) {
        const file = this.files.selected[i]
        const data = await readLocalFile(file)
        const lines = splitLines(data)
        this.table.rows.push({
          status: 'READY',
          row: i,
          file_index: i,
          file,
          filename: file.name,
          file_type: this.files.type,
          file_skip: '0',
          fields: [],
          errors: [],
          lines
        })
      }

      // this.files.selected.forEach((file, i) => {
      //   this.table.rows.push({
      //     status: 'READY',
      //     row: i,
      //     file_index: i,
      //     file,
      //     filename: file.name,
      //     file_type: this.files.type,
      //     file_skip: '0',
      //     fields: [],
      //     errors: []
      //   })
      // })
      this.renderHot()
    },
    async submit () {
      this.error = null
      this.table.selected = null

      // check form inputs (organization, files)
      if (!this.$refs.form.validate()) {
        this.error = 'Check form errors above'
        return
      }

      this.loading = true
      this.table.failedCount = 0
      for (let i = 0; i < this.table.rows.length; i++) {
        let row = this.table.rows[i]

        // skip empty rows
        if (this.hot.isEmptyRow(i)) continue

        try {
          row = await this.validateRow(row, i)
          if (row.config) {
            await this.uploadFile(row, i)
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

      if (!this.table.rows.some(d => d.status !== 'SUCCESS')) {
        evt.$emit('notify', 'Files have been uploaded', 'success')
        this.$router.push({ name: 'manageFiles' })
      }
    },
    async validateRow (row, i) {
      // console.log('validateRow()', i, row)

      if (row.status === 'SUCCESS') return row
      if (this.hot.isEmptyRow(i)) return row

      this.message = `Validating ${row.filename}`

      const columns = this.hot.getSettings().columns
      columns.forEach((column, j) => {
        this.hot.setCellMeta(i, j, 'valid', true)
      })
      row.status = 'VALIDATING'
      row.errors = []
      row.row = i
      row.config = undefined

      this.renderHot()

      try {
        const {
          filename,
          fields,
          config,
          status,
          errors,
          file_index, // eslint-disable-line
          file,
          lines,
          n_rows, // eslint-disable-line
          row: rowId,
          ...value
        } = row

        const parsed = await parseCsvFile(this.files.selected[i], value.file_skip)
        if (parsed.data.length === 0) throw new Error('File is empty')
        row.n_rows = parsed.data.length
        row.fields = parsed.meta.fields.filter(d => d !== '')
        if (!value.datetime_format) {
          value.datetime_format = 'GUESS'
        }
        row.config = validateFileConfig(value, row.fields, this.stations)
        if (value.datetime_format === 'GUESS') {
          const timestampString = getTimestampString(parsed.data[0], row.config.datetime_column, row.config.time_column)
          let format = guessDatetimeFormat(timestampString)
          format = Array.isArray(format) ? format.join(' ') : format
          if (format) {
            row.datetime_format = format
            row.config.datetime_format = format
          } else {
            const error = new Error('InvalidDatetimeFormat')
            error.details = [{
              path: ['datetime_format'],
              message: `Failed to guess <strong>Date/time Format</strong> from first timestamp ('${timestampString}')`
            }]
            throw error
          }
        }
        parsed.data.forEach((d, i) => {
          try {
            const value = getTimestampString(d, row.config.datetime_column, row.config.time_column)
            parseTimestampString(value, row.config.datetime_format)
          } catch (err) {
            err.name = ''
            const error = new Error('InvalidTimestamp')
            error.details = [{
              path: ['datetime_format'],
              message: `<strong>Invalid Timestamp</strong>: ${err.toString()} at file row ${i + 1}`
            }]
            throw error
          }
        })
      } catch (err) {
        if (!err.details) {
          row.errors = [{
            message: err.message || this.$errorMessage(err),
            details: err
          }]
          const j = this.hot.propToCol('filename')
          this.hot.setCellMeta(i, j, 'valid', false)
        } else {
          row.errors = err.details
          console.log(err.details)
          row.errors.forEach(d => {
            const prop = d.path[0]
            const j = this.hot.propToCol(prop)
            if (typeof j === 'number') {
              const column = columns[j]
              if (column.label) {
                d.message = d.message.replace(`"${prop}"`, `<strong>${column.label.replace('†', '').replace('*', '')}</strong>`)
              }
              this.hot.setCellMeta(i, j, 'valid', false)
            }
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
    async uploadFile (row, i) {
      if (row.status === 'SUCCESS' || row.status === 'INVALID') return

      const organizationId = this.organization.id
      const file = this.files.selected[row.file_index]
      const config = row.config

      if (!config) throw new Error(`File configuration object not found (row=${i + 1})`)

      row.status = 'UPLOADING'
      this.renderHot()

      try {
        this.message = `Uploading ${file.name}`
        await uploader(file, config, organizationId)
        row.status = 'SUCCESS'
      } catch (err) {
        console.log(err)
        row.status = 'FAILED'
        row.errors = [{
          message: this.$errorMessage(err)
        }]
      } finally {
        this.message = null
        this.renderHot()
      }
    },
    downloadStations () {
      this.$download.stations(`AKTEMP-${this.organization.code}-stations.csv`, this.stations)
    },
    async removeUploadedFiles () {
      this.loading = true
      const rowsToRemove = []
      this.table.rows.forEach((d, i) => {
        if (d.status === 'SUCCESS') rowsToRemove.push([i, 1])
      })
      this.hot.alter('remove_row', rowsToRemove)
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
