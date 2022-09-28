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
                <p class="black--text">Each file must be in comma-separated value (CSV) format.</p>
                <v-row>
                  <v-col cols="12" md="6" class="pb-0">
                    <v-file-input
                      ref="filesInput"
                      v-model="files.selected"
                      :rules="files.rules"
                      label="Select data files"
                      truncate-length="200"
                      @change="initTable"
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
                    href="static/AKTEMP-files-template.xlsx"
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
                  <div class="text-caption mt-2">Status: {{ message || 'Ready' }}</div>
                  <div class="text--secondary caption mb-4">
                    * = Required. Ctrl+c/Ctrl+v to copy/paste. Right-click to undo/redo.
                  </div>

                  <div v-if="table.selectedRow">
                    <Alert
                      v-if="table.selectedRow.status === 'READY'"
                      type="info"
                      title="File is Ready"
                      style="max-width:800px"
                    >
                      File ({{table.selectedRow.filename}}) is ready to be validated and uploaded.
                    </Alert>
                    <Alert
                      v-if="table.selectedRow.status === 'VALIDATING'"
                      type="warning"
                      title="Validating File"
                      style="max-width:800px"
                    >
                      File ({{table.selectedRow.filename}}) is being validated.
                    </Alert>
                    <Alert
                      v-if="table.selectedRow.status === 'UPLOADING'"
                      type="warning"
                      title="File is Uploading"
                      style="max-width:800px"
                    >
                      File ({{table.selectedRow.filename}}) is being uploaded.
                    </Alert>
                    <Alert
                      v-else-if="table.selectedRow.status === 'INVALID'"
                      type="error"
                      title="Validation Failed"
                      style="max-width:800px"
                    >
                      <!-- <pre>
                        Columns: {{ joinStrings(table.selectedRow.fields) }}
                      </pre> -->
                      <table class="mt-2">
                        <tbody>
                          <tr>
                            <td class="text-right pr-2">Row:</td>
                            <td class="font-weight-bold">{{ table.selectedRow.table_row }}</td>
                          </tr>
                          <tr>
                            <td class="text-right pr-2">Filename:</td>
                            <td class="font-weight-bold">{{ table.selectedRow.filename }}</td>
                          </tr>
                          <tr>
                            <td class="text-right pr-2"># Rows:</td>
                            <td class="font-weight-bold">{{ table.selectedRow.n_rows === 0 || !!table.selectedRow.n_rows ? table.selectedRow.n_rows.toLocaleString() : '' }}</td>
                          </tr>
                          <tr>
                            <td class="text-right pr-2" style="vertical-align:top">Columns:</td>
                            <td class="font-weight-bold">
                              <div v-for="field in table.selectedRow.fields" :key="field">'{{ field }}'</div>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <p class="mt-4">Please fix the following errors, then click Submit to try again</p>
                      <ul>
                        <li v-for="(err, i) in table.selectedRow.errors" :key="'err-' + i" class="mb-2">
                          <div v-html="err.error"></div>
                          <div v-if="err.column && err.column.type === 'dropdown'">
                            Allowed values: {{ err.column.source.map(d => `'${d}'`).join(', ') }}
                          </div>
                          <div v-if="err.details" v-html="err.details"></div>
                        </li>
                      </ul>
                    </Alert>
                    <Alert
                      v-else-if="table.selectedRow.status === 'SUCCESS'"
                      type="success"
                      title="File Uploaded Successfully"
                      style="max-width:800px"
                    >
                      <table class="mt-2">
                        <tbody>
                          <tr>
                            <td class="text-right pr-2">Row:</td>
                            <td class="font-weight-bold">{{ table.selectedRow.table_row }}</td>
                          </tr>
                          <tr>
                            <td class="text-right pr-2">Filename:</td>
                            <td class="font-weight-bold">{{ table.selectedRow.filename }}</td>
                          </tr>
                          <tr>
                            <td class="text-right pr-2"># Rows:</td>
                            <td class="font-weight-bold">{{ table.selectedRow.n_rows === 0 || !!table.selectedRow.n_rows ? table.selectedRow.n_rows.toLocaleString() : '' }}</td>
                          </tr>
                          <tr>
                            <td class="text-right pr-2" style="vertical-align:top">Columns:</td>
                            <td class="font-weight-bold">
                              <div v-for="field in table.selectedRow.fields" :key="field">'{{ field }}'</div>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div class="mt-4">This file has been uploaded to the server and queued for processing. Visit the <router-link :to="{ name: 'manageFiles' }">Manage Files</router-link> page to check on its status.</div>
                    </Alert>
                    <Alert
                      v-else-if="table.selectedRow.status === 'FAILED'"
                      type="error"
                      title="File Upload Failed"
                      style="max-width:800px"
                    >
                      <table class="mt-2">
                        <tbody>
                          <tr>
                            <td class="text-right pr-2">Row:</td>
                            <td class="font-weight-bold">{{ table.selectedRow.table_row }}</td>
                          </tr>
                          <tr>
                            <td class="text-right pr-2">Filename:</td>
                            <td class="font-weight-bold">{{ table.selectedRow.filename }}</td>
                          </tr>
                          <tr>
                            <td class="text-right pr-2"># Rows:</td>
                            <td class="font-weight-bold">{{ table.selectedRow.n_rows === 0 || !!table.selectedRow.n_rows ? table.selectedRow.n_rows.toLocaleString() : '' }}</td>
                          </tr>
                          <tr>
                            <td class="text-right pr-2" style="vertical-align:top">Columns:</td>
                            <td class="font-weight-bold">
                              <div v-for="field in table.selectedRow.fields" :key="field">'{{ field }}'</div>
                            </td>
                          </tr>
                        </tbody>
                      </table>

                      <div class="body-1 font-weight-bold mt-4">Server Errors</div>
                      <p>Please fix the following errors, then click Submit to try again</p>
                      <ul>
                        <li v-for="(err, i) in table.selectedRow.errors" :key="'err-' + i" class="mb-2">
                          <div v-html="err.error"></div>
                          <div v-if="err.details" v-html="err.details"></div>
                        </li>
                      </ul>
                    </Alert>
                  </div>
                  <!-- <Alert
                    v-else
                    type="info"
                    title="Select a File"
                    style="max-width:800px"
                    prominent
                    icon="mdi-chevron-up"
                  >
                    Click on any cell in the table above to view the status of each file.
                  </Alert> -->

                  <Alert
                    v-if="table.failedCount > 0"
                    type="warning"
                    title="Table Contains Failed or Invalid Files"
                    style="max-width:800px"
                    class="mb-0"
                  >
                    <p>
                      {{ table.failedCount.toLocaleString() }} file(s) failed to be validated or uploaded to the server.
                    </p>
                    <div>
                      Click on any row marked by <span style="color:white;background-color:#ff5252;width:6px">&nbsp;✕&nbsp;</span> for more details.
                    </div>
                  </Alert>
                </div>

                <div v-if="error">
                  <v-divider class="mb-4"></v-divider>

                  <Alert type="error" title="Error" class="mb-0" style="max-width:800px">{{ error }}</Alert>
                </div>

                <!-- <div v-if="!loading && failedFiles.length > 0" class="pb-1">
                  <v-divider class="mb-4"></v-divider>
                  <Alert type="error" title="Failed to Save Stations" class="my-4" style="max-width:800px">
                    <p>One or more files failed to be saved on the server. Fix the following errors and click Submit to try again.</p>
                    <div v-for="(file, i) in failedFiles.slice(0, this.maxFailedFileErrors)" :key="'failed-' + i">
                      <div class="font-weight-bold body-1">Row {{ file.$row + 1 }} ({{ file.filename }}):</div>
                      <div v-for="(error, j) in file.errors" :key="'error-' + i + '-' + j" class="ml-4">
                        <div class="font-weight-bold">Error {{ j + 1 }}: {{ error.error }}</div>
                        <p>{{ error.details }}</p>
                      </div>
                    </div>
                    <p v-if="failedFiles.length > table.maxFailedFileErrors" class="body-1">
                      and {{ failedFiles.length - table.maxFailedFileErrors }} more...
                    </p>
                    <div v-if="savedFiles.length > 0">
                      <p class="mt-4">Files marked by <span style="color:white;background-color:#4caf50;width:6px">&nbsp;✓&nbsp;</span> have been saved to the server and can be removed from the table above. Click the following button to remove them and focus on the remaining files that were not saved.</p>
                      <v-btn color="default" @click="removeSavedFiles"><v-icon small left>mdi-delete</v-icon> Remove Saved Files</v-btn>
                    </div>
                  </Alert>
                </div> -->
              </v-card-text>

              <v-divider></v-divider>

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
import { parseCsvFile, parseBooleanOption, isNumber } from '@/lib/utils'
import uploader from '@/lib/uploader'
import { fileTypeOptions, timezoneModes, depthCategoryOptions, temperatureUnitsOptions, sensorAccuracyOptions, depthUnitsOptions, booleanOptions, utcOffsetOptions } from '@/lib/constants'

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
          v => v.length > 0 || 'No files selected'
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
          height: 270,
          licenseKey: 'non-commercial-and-evaluation',
          contextMenu: ['clear_column', '---------', 'undo', 'redo'],
          minRows: 0,
          fixedColumnsStart: 3,
          manualColumnResize: true,
          preventOverflow: 'horizontal',
          dataSchema: {
            status: '',
            table_row: '',
            filename: '',
            skip_lines: '',
            type: '',
            station_code: '',
            station_column: '',
            datetime_column: '',
            time_column: '',
            timezone_mode: '',
            timezone_utcoffset: '',
            timezone_column: '',
            depth_category: '',
            depth_value: '',
            depth_column: '',
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
                td.style.background = '#1976d2'
              } else {
                td.innerText = ''
                td.style.background = '#EEE'
              }
            },
            readOnly: true
          },
          {
            prop: 'table_row',
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
            prop: 'skip_lines',
            label: 'Skip Lines*',
            validate: (row) => isNumber(row.skip_lines),
            rule: '<b>Skip Lines</b> is required and must be a number'
          },
          {
            prop: 'type',
            label: 'File Type*',
            validate: (row) => fileTypeOptions.map(d => d.value).includes(row.type),
            rule: '<b>File Type</b> is required and must match an allowed value',
            type: 'dropdown',
            source: fileTypeOptions.map(d => d.value),
            width: '120px'
          },
          {
            prop: 'station_code',
            label: 'Station Code',
            validate: (row) => (!!row.station_code &&
                                this.stationCodes.includes(row.station_code)) ||
                                row.station_column,
            rule: '<b>Station Code</b> must match an existing station for the selected organization (or be blank if file contains a column of station codes as specified by <b>Station Column</b>)'
          },
          {
            prop: 'station_column',
            label: 'Station Column',
            validate: (row) => row.station_code || row.fields.includes(row.station_column),
            rule: '<b>Station Column</b> must match a column name (or be blank if file contains data for a single station as specified by <b>Station Code</b>)'
          },
          {
            prop: 'datetime_column',
            label: 'Datetime/Date Column*',
            validate: (row) => row.fields.includes(row.datetime_column),
            rule: '<b>Datetime/Date Column</b> is required and must match a column name'
          },
          {
            prop: 'time_column',
            label: 'Time Column',
            validate: (row) => !row.time_column || row.fields.includes(row.time_column),
            rule: '<b>Time Column</b> must match a column name (or be blank if times are included in the <b>Datetime Column</b>)'
          },
          {
            prop: 'timezone_mode',
            label: 'Timezone Mode*',
            validate: (row) => timezoneModes.map(d => d.value).includes(row.timezone_mode),
            rule: '<b>Timezone Mode</b> is required and must match an allowed value',
            type: 'dropdown',
            source: timezoneModes.map(d => d.value)
          },
          {
            prop: 'timezone_utcoffset',
            label: 'UTC Offset',
            validate: (row) => row.timezone_mode !== 'UTCOFFSET' || utcOffsetOptions.map(d => d.value).includes(row.timezone_utcoffset),
            rule: '<b>UTC Offset</b> is required and must match an allowed value when <b>Timezone Mode</b>=<b>UTCOFFSET</b>',
            type: 'dropdown',
            source: utcOffsetOptions.map(d => d.value)
          },
          {
            prop: 'timezone_column',
            label: 'Timezone Column',
            validate: (row) => row.timezone_mode !== 'COLUMN' || row.fields.includes(row.timezone_column),
            rule: '<b>Timezone Column</b> is required when <b>Timezone Mode</b>=<b>COLUMN</b> and must match a column name'
          },
          {
            prop: 'value_column',
            label: 'Temperature Column*',
            validate: (row) => row.fields.includes(row.value_column),
            rule: '<b>Temperature Column</b> is required and must match a column name'
          },
          {
            prop: 'value_units',
            label: 'Temperature Units*',
            validate: (row) => temperatureUnitsOptions.map(d => d.value).includes(row.value_units),
            rule: '<b>Temperature Units</b> is required and must be an allowed value',
            type: 'dropdown',
            source: temperatureUnitsOptions.map(d => d.value)
          },
          {
            prop: 'value_missing',
            label: 'Missing Values'
          },
          {
            prop: 'flag_column',
            label: 'Flag Column',
            validate: (row) => !row.flag_column || row.fields.includes(row.flag_column),
            rule: '<b>Flag Column</b> must match a column name (or be blank if not flags are present)'
          },
          {
            prop: 'depth_category',
            label: 'Depth Category',
            validate: (row) => !row.depth_category || depthCategoryOptions.map(d => d.value).includes(row.depth_category),
            rule: '<b>Depth Category</b> must be one of the allowed values (or blank if unknown)',
            type: 'dropdown',
            source: depthCategoryOptions.map(d => d.value)
          },
          {
            prop: 'depth_value',
            label: 'Numeric Depth',
            validate: (row) => row.depth_value === undefined ||
              row.depth_value === null ||
              row.depth_value === '' ||
              isNumber(row.depth_value),
            rule: '<b>Numeric Depth</b> must be numeric (or blank if unknown)'
          },
          {
            prop: 'depth_column',
            label: 'Depth Column',
            validate: (row) => !row.depth_column || row.fields.includes(row.depth_column),
            rule: '<b>Depth Column</b> must match a column name (or be blank if unknown)'
          },
          {
            prop: 'depth_units',
            label: 'Depth Units',
            validate: (row) => (!row.depth_column && !row.depth_value) || depthUnitsOptions.map(d => d.value).includes(row.depth_units),
            rule: '<b>Depth Units</b> is required and must match an allowed value if either <b>Numeric Depth</b> or <b>Depth Column</b> is not blank',
            type: 'dropdown',
            source: depthUnitsOptions.map(d => d.value)
          },
          {
            prop: 'accuracy',
            label: 'Sensor Accuracy',
            validate: (row) => !row.accuracy || sensorAccuracyOptions.map(d => d.value).includes(row.accuracy),
            rule: '<b>Sensor Accuracy</b> must match an allowed value (or be blank if unknown)',
            type: 'dropdown',
            source: sensorAccuracyOptions.map(d => d.value)
          },
          {
            prop: 'sop_bath',
            label: 'SOP Bath',
            validate: (row) => !row.sop_bath || sensorAccuracyOptions.map(d => d.value).includes(row.sop_bath),
            rule: '<b>SOP Bath</b> must match an allowed value (or be blank if unknown)',
            type: 'dropdown',
            source: booleanOptions.map(d => d.value)
          },
          {
            prop: 'reviewed',
            label: 'Reviewed',
            validate: (row) => !row.reviewed || booleanOptions.map(d => d.value).includes(row.reviewed),
            rule: '<b>Reviewed</b> must match an allowed value (or be blank if unknown)',
            type: 'dropdown',
            source: booleanOptions.map(d => d.value)
          }
        ],
        maxFailedFileErrors: 5,
        selectedRow: null,
        failedCount: 0
      }
    }
  },
  computed: {
    ...mapGetters({
      organizations: 'manage/organizations',
      defaultOrganization: 'manage/organization'
    }),
    stationCodes () {
      return this.organization && this.organization.stations
        ? this.organization.stations.map(d => d.code)
        : []
    }
    // savedFiles () {
    //   const copy = this.table.rows.slice()
    //   copy.forEach((d, i) => {
    //     d.$row = i
    //   })
    //   return copy.filter(d => d.status === 'SUCCESS')
    // }
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
    Handsontable.hooks.add('afterSelection', this.afterSelection, this.$refs.hot.hotInstance)
    this.setDefaultOrganization()
  },
  beforeDestroy () {
    Handsontable.hooks.remove('afterSelection', this.afterSelection, this.$refs.hot.hotInstance)
  },
  methods: {
    setDefaultOrganization () {
      this.organization.selected = this.defaultOrganization ? this.defaultOrganization : null
    },
    afterSelection (row) {
      this.table.selectedRow = this.table.rows[row]
    },
    async fetchStations () {
      console.log('fetchStations')
      if (!this.organization.selected) {
        this.organization.stations = []
        return
      }
      try {
        this.organization.stations = await this.$http.restricted
          .get(`/organizations/${this.organization.selected.id}/stations`)
          .then(d => d.data)
        this.renderHot()
      } catch (err) {
        this.error = this.$errorMessage(err)
      }
    },
    initTable () {
      console.log('initTable')
      this.error = null
      this.table.rows.splice(0, this.table.rows.length)
      this.table.selectedRow = null

      this.files.selected.forEach((file, i) => {
        this.table.rows.push({
          status: 'READY',
          table_row: i + 1,
          file_index: i,
          file,
          filename: file.name,
          skip_lines: '0',
          fields: [],
          errors: []
        })
      })
      // this.renderHot()
    },
    findColumnIndex (prop) {
      return this.table.columns.findIndex(d => d.prop === prop)
    },
    async validateTable () {
      console.log('validateTable')
      const hot = this.$refs.hot.hotInstance

      for (let i = 0; i < this.table.rows.length; i++) {
        const row = this.table.rows[i]
        this.message = `Validating ${row.filename}`
        row.status = 'VALIDATING'
        row.errors = []
        this.renderHot()

        try {
          const parsed = await parseCsvFile(this.files.selected[i], Number(row.skip_lines))
          console.log(parsed)
          row.n_rows = parsed.data.length
          row.fields = parsed.meta.fields.filter(d => d !== '')
          hot.setCellMeta(i, this.findColumnIndex('filename'), 'valid', true)
        } catch (err) {
          console.error(err)
          hot.setCellMeta(i, this.findColumnIndex('filename'), 'valid', false)
          row.errors.push({
            error: '<b>Failed to read file</b>',
            details: this.$errorMessage(err)
          })
        }

        if (row.errors.length === 0) {
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
        }

        if (row.errors.length > 0) {
          row.status = 'INVALID'
        } else {
          row.status = 'READY'
        }

        this.renderHot()
      }
      this.message = null
    },
    async uploadFiles () {
      // const hot = this.$refs.hot.hotInstance
      for (let i = 0; i < this.table.rows.length; i++) {
        const row = this.table.rows[i]
        if (row.status === 'SUCCESS' || row.status === 'INVALID') continue

        const file = this.files.selected[i]
        const config = this.createConfig(row)
        const organizationId = this.organization.selected.id

        row.status = 'UPLOADING'
        this.renderHot()

        try {
          this.message = `Uploading ${file.name}`
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
    },
    updateFailedCount () {
      console.log('updateFailedCount')
      this.table.failedCount = this.table.rows.filter(d => d.status === 'FAILED' || d.status === 'INVALID').length
    },
    renderHot () {
      if (this.$refs.hot) {
        this.$refs.hot.hotInstance.render()
      }
    },
    createConfig (row) {
      const config = {
        file: {
          filename: row.filename,
          skipLines: row.skip_lines
        },
        station: {
          mode: row.station_code
            ? 'STATION'
            : row.station_column
              ? 'COLUMN'
              : null
        },
        depth: {
          category: row.depth_category,
          value: row.depth_value,
          column: row.depth_column,
          units: row.depth_units
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

      if (config.station.mode === 'STATION') {
        const station = this.organization.stations.find(d => d.code === row.station_code)
        if (!station) {
          throw new Error(`Could not find station with code '${row.station_code}'`)
        }
        config.station.stationId = station.id
      } else if (config.station.mode === 'COLUMN') {
        config.station.column = row.station_column
      }

      if (row.time_column) {
        config.timestamp.columns.push(row.time_column)
      }

      switch (row.timezone_mode) {
        case 'UTCOFFSET':
          config.timestamp.timezone.utcOffset = parseInt(row.timezone_utcoffset)
          break
        case 'COLUMN':
          config.timestamp.timezone.column = row.timezone_column
          break
      }

      config.meta.sop_bath = parseBooleanOption(row.sop_bath)
      config.meta.accuracy = row.accuracy ? row.accuracy : null
      config.meta.reviewed = row.reviewed ? parseBooleanOption(row.reviewed) : false

      return config
    },
    async submit () {
      this.error = null

      if (!this.$refs.form.validate()) {
        // organization or files not selected
        this.error = 'Check form errors above'
        return
      }

      this.table.rows.forEach(d => {
        d.status = d.status === 'FAILED' ? null : d.status
        d.errors = []
      })

      this.loading = true
      try {
        await this.validateTable()
      } catch (err) {
        this.error = this.$errorMessage(err)
        return this.renderHot()
      }

      this.renderHot()

      try {
        // console.log('uploading...')
        await this.uploadFiles()
      } catch (err) {
        console.log(err)
        this.error = this.$errorMessage(err)
      }

      this.loading = false

      this.updateFailedCount()
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
      this.$download.csv(this.organization.stations, `AKTEMP-${this.organization.selected.code}-stations.csv`)
    },
    removeSavedFiles () {
      this.table.rows = this.table.rows.filter(d => d.status !== 'SUCCESS')
    }
  }
}
</script>

<style>

</style>
