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

            <v-card-text>
              <v-form ref="form" @submit.prevent="submit" :disabled="loading">
                <v-row>
                  <v-col cols="12">
                    <v-card class="pb-0">
                      <v-card-text class="pb-0">
                        <div class="text-h6 mb-2">Organization</div>
                        <p class="black--text">Select the organization to which these stations will be saved.</p>
                        <v-row>
                          <v-col cols="12" md="6" lg="4">
                            <v-select
                              v-model="organization.selected"
                              :items="organizations"
                              :rules="organization.rules"
                              item-text="code"
                              label="Organization"
                              validate-on-blur
                              outlined
                              return-object
                              style="z-index:1000"
                            ></v-select>
                          </v-col>
                        </v-row>
                        <v-divider class="mb-4"></v-divider>
                        <div class="text-h6 mb-2">Stations Table</div>
                        <p class="black--text">Enter your stations into the table below or copy &amp; paste from Excel. Instructions provided in the template below.</p>
                        <HotTable
                          :data="stations"
                          :rowHeaders="false"
                          :colHeaders="true"
                          :settings="settings"
                          ref="hot"
                        >
                          <HotColumn
                            v-for="col in columns"
                            :key="col.prop"
                            :data="col.prop"
                            :title="`${col.label}${col.required ? '*' : ''}`"
                            :validator="col.validator"
                            :editor="col.editor"
                            :select-options="col.options"
                            :read-only="col.readOnly"
                            :renderer="col.renderer"
                            :width="col.width"
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
                              href="static/aktemp-stations-template.xlsx"
                              download
                              class="mb-4"
                            ><v-icon left>mdi-download</v-icon> Download Template</v-btn>
                            <p class="black--text">After you have filled out the table in the template, copy and paste your stations from Excel into the table above.</p>
                          </v-col>
                        </v-row>

                        <Alert
                          type="error"
                          v-for="(d, i) in invalidCells.slice(0, maxInvalidCellErrors)"
                          :key="i"
                          :title="`Invalid ${d.column.label} (${ d.value || 'null' }) in row ${ d.row + 1 }`"
                        >
                          {{ d.column.rule }}
                        </Alert>
                        <p v-if="invalidCells.length > maxInvalidCellErrors" class="body-1">
                          and {{ invalidCells.length - maxInvalidCellErrors }} more...
                        </p>

                        <Alert type="error" v-for="(station, i) in failedStations" :key="i" :title="`Failed to Save Station (Row ${i + 1})`">
                          {{ station.error }}
                        </Alert>
                      </v-card-text>

                      <v-divider></v-divider>
                      <v-card-actions class="py-4 pl-4">
                        <v-btn type="submit" color="primary" class="mr-4" :loading="loading">Submit</v-btn>
                        <v-btn color="default" text @click="clearTable" :disabled="loading">Clear</v-btn>
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
import { timezoneOptions, placementOptions, waterbodyTypeOptions, booleanOptions, booleanOrNullOptions } from '@/lib/constants'
import { parseBooleanOption, sleep } from '@/lib/utils'
import evt from '@/events'

export default {
  name: 'ManageStationsImport',
  data () {
    return {
      loading: false,
      error: false,

      settings: {
        height: 'auto',
        licenseKey: 'non-commercial-and-evaluation',
        dropdown: true,
        contextMenu: ['row_above', 'row_below', '---------', 'remove_row', 'undo', 'redo'],
        minRows: 1,
        stretchH: 'all',
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
            } else {
              td.innerText = ''
              td.style.background = '#EEE'
            }
          },
          readOnly: true
        },
        {
          prop: 'code',
          label: 'Code',
          required: true,
          validator: function (value, callback) {
            callback(!!value && value.length >= 4 && value.length <= 100)
          },
          rule: 'Code must be unique and between 4 to 50 characters'
        },
        {
          prop: 'description',
          label: 'Description'
        },
        {
          prop: 'latitude',
          label: 'Latitude',
          required: true,
          validator: function (value, callback) {
            callback(!!value && +value > -90 && +value < 90)
          },
          rule: 'Latitude must be a decimal number between -90 and 90'
        },
        {
          prop: 'longitude',
          label: 'Longitude',
          required: true,
          validator: function (value, callback) {
            callback(!!value && +value > -180 && +value < 180)
          },
          rule: 'Longitude must be a decimal number between -180 and 180'
        },
        {
          prop: 'timezone',
          label: 'Timezone',
          required: true,
          validator: function (value, callback) {
            callback(timezoneOptions.map(d => d.id).includes(value))
          },
          rule: `Timezone must be one of: [${timezoneOptions.map(d => `'${d.id}'`).join(', ')}]`,
          editor: 'select',
          options: timezoneOptions.map(d => d.id)
        },
        {
          prop: 'placement',
          label: 'Placement',
          required: true,
          validator: function (value, callback) {
            callback(placementOptions.map(d => d.id).includes(value))
          },
          rule: `Placement must be one of: [${placementOptions.map(d => `'${d.id}'`).join(', ')}]`,
          editor: 'select',
          options: placementOptions.map(d => d.id)
        },
        {
          prop: 'waterbody_name',
          label: 'Waterbody Name'
        },
        {
          prop: 'waterbody_type',
          label: 'Waterbody Type',
          required: true,
          validator: function (value, callback) {
            callback(waterbodyTypeOptions.map(d => d.id).includes(value))
          },
          rule: `Waterbody Type must be one of: [${waterbodyTypeOptions.map(d => `'${d.id}'`).join(', ')}]`,
          editor: 'select',
          options: waterbodyTypeOptions.map(d => d.id)
        },
        {
          prop: 'active',
          label: 'Active',
          required: true,
          validator: function (value, callback) {
            callback(booleanOrNullOptions.includes(value))
          },
          rule: `Active must be one of: [${booleanOrNullOptions.map(d => `'${d}'`).join(', ')}]`,
          editor: 'select',
          options: booleanOrNullOptions
        },
        {
          prop: 'mixed',
          label: 'Well-mixed',
          required: true,
          validator: function (value, callback) {
            callback(booleanOrNullOptions.includes(value))
          },
          rule: `Well-mixed must be one of: [${booleanOrNullOptions.map(d => `'${d}'`).join(', ')}]`,
          editor: 'select',
          options: booleanOrNullOptions
        },
        {
          prop: 'reference',
          label: 'Reference URL'
        },
        {
          prop: 'private',
          label: 'Private',
          required: true,
          validator: function (value, callback) {
            callback(booleanOptions.includes(value))
          },
          rule: `Private must be one of: [${booleanOptions.map(d => `'${d}'`).join(', ')}]`,
          editor: 'select',
          options: booleanOptions
        }
      ],

      organization: {
        selected: null,
        rules: [
          v => !!v || 'Organization is required'
        ]
      },
      stations: [],
      invalidCells: [],
      maxInvalidCellErrors: 5
    }
  },
  computed: {
    ...mapGetters({
      organizations: 'manage/organizations',
      defaultOrganization: 'manage/organization'
    }),
    failedStations () {
      return this.stations.filter(d => d.status === 'FAILED')
    }
  },
  watch: {
    defaultOrganization () {
      this.setDefaultOrganization()
    }
  },
  mounted () {
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
    afterValidate (isValid, value, row, prop) {
      if (!isValid) {
        if (!this.invalidCells.find(d => d.row === row && d.prop === prop)) {
          this.invalidCells.unshift({ value, row, prop, column: this.columns.find(d => d.prop === prop) })
        }
      }
    },
    afterChange (changes, source) {
      if (source === 'updateData') return
      this.validateSync()
    },
    validateSync (changes, source) {
      this.invalidCells = []
      this.$refs.hot.hotInstance.validateCells()
    },
    validate () {
      this.invalidCells = []
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
    clearTable () {
      this.invalidCells = []
      this.stations.splice(0, this.stations.length)
      this.renderHot()
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

      if (this.stations.length === 0) {
        this.error = 'No stations found in the table above'
      }

      this.loading = true

      this.stations.forEach(d => {
        d.status = d.status === 'FAILED' ? null : d.status
        d.error = null
      })

      this.renderHot()

      for (let i = 0; i < this.stations.length; i++) {
        await sleep(500)
        if (this.$refs.hot.hotInstance.isEmptyRow(i)) {
          continue
        }
        if (this.stations[i].status === 'SUCCESS') {
          continue
        }
        this.stations[i].status = null
        this.stations[i].error = null
        try {
          await this.createStation(this.stations[i])
          this.stations[i].status = 'SUCCESS'
        } catch (err) {
          this.stations[i].status = 'FAILED'
          this.stations[i].error = (err.response && err.response.data.message) || err.toString() || 'Unknown error'
        }
        this.renderHot()
      }
      if (this.failedStations.length === 0) {
        evt.$emit('notify', 'Stations table has been imported', 'success')
        return this.$router.push({ name: 'manageStations' })
      } else {
        if (this.failedStations.length > 0) {
          this.error = `Failed to save ${this.failedStations.length} station(s). Fix the errors listed above, and click Submit again. Any stations that were successfully saved will be skipped in future attempts.`
        }
      }

      this.loading = false
      this.renderHot()
    },
    renderHot () {
      this.$refs.hot && this.$refs.hot.hotInstance.render()
    },
    async createStation (station) {
      const organizationId = this.organization.selected.id
      const payload = {
        code: station.code.trim(),
        description: station.description,
        latitude: station.latitude,
        longitude: station.longitude,
        timezone: station.timezone,
        placement: station.placement,
        waterbody_name: station.waterbody_name,
        waterbody_type: station.waterbody_type,
        active: parseBooleanOption(station.active),
        mixed: parseBooleanOption(station.mixed),
        reference: station.reference,
        private: parseBooleanOption(station.private)
      }
      delete payload.status
      delete payload.error

      return await this.$http.restricted.post(`/organizations/${organizationId}/stations`, payload)
    }
  }
}
</script>

<style>

</style>
