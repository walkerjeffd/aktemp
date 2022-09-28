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
                    <p class="black--text">After you have filled out the table in the template, copy and paste your stations (excluding header row) from Excel into the table below.</p>
                  </v-col>
                </v-row>

                <HotTable
                  :data="stations"
                  :colHeaders="true"
                  :settings="settings"
                  ref="hot"
                >
                  <HotColumn
                    v-for="col in columns"
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
                <div class="text--secondary caption">
                  * = Required. Ctrl+c/Ctrl+v to copy/paste. Right-click to add/remove rows or undo/redo.
                </div>

                <Alert
                  type="error"
                  v-for="(d, i) in invalidCells.slice(0, maxInvalidCellErrors)"
                  :key="i"
                  :title="`Row ${ d.row + 1 }: Invalid ${d.column.label} (${ d.value || 'null' })`"
                  style="max-width:800px"
                >
                  {{ d.column.rule }}
                </Alert>

                <p v-if="invalidCells.length > maxInvalidCellErrors" class="body-1 font-italic black--text">
                  and {{ invalidCells.length - maxInvalidCellErrors }} more...
                </p>

                <div v-if="error" class="pb-1">
                  <v-divider class="mb-4"></v-divider>
                  <Alert type="error" title="Error" class="my-4" style="max-width:800px">{{ error }}</Alert>
                </div>

                <div v-if="!loading && failedStations.length > 0" class="pb-1">
                  <v-divider class="mb-4"></v-divider>
                  <Alert type="error" title="Failed to Save Stations" class="my-4" style="max-width:800px">
                    <p>One or more stations failed to be saved on the server. Fix the following errors and click Submit to try again.</p>
                    <ul>
                      <li v-for="(station, i) in failedStations" :key="'failed-' + i">
                        <strong>Row {{ station.$row + 1 }}</strong>: {{ station.error }}
                      </li>
                    </ul>
                    <div v-if="stations.length > failedStations.length">
                      <p class="mt-4">Stations marked by <span style="color:white;background-color:#4caf50;width:6px">&nbsp;✓&nbsp;</span> have been saved to the server and can be removed from the table above. Click the following button to remove them and focus on the remaining stations that were not saved.</p>
                      <v-btn color="default" @click="removeSavedStations"><v-icon small left>mdi-delete</v-icon> Remove Saved Stations</v-btn>
                    </div>
                  </Alert>
                </div>
              </v-card-text>

              <v-divider></v-divider>
              <v-card-actions class="py-4 pl-4">
                <v-btn type="submit" color="primary" class="mr-4" :loading="loading">Submit</v-btn>
                <v-btn color="default" text @click="initTable" :disabled="loading">Clear</v-btn>

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
import { timezoneOptions, placementOptions, waterbodyTypeOptions, booleanOptions, fieldConstraints } from '@/lib/constants'
import { parseBooleanOption, isNumber } from '@/lib/utils'
import evt from '@/events'

export default {
  name: 'ManageStationsBatch',
  data () {
    return {
      loading: false,
      error: false,

      settings: {
        height: 'auto',
        licenseKey: 'non-commercial-and-evaluation',
        contextMenu: ['row_above', 'row_below', 'remove_row', '---------', 'clear_column', '---------', 'undo', 'redo'],
        minRows: 1,
        fixedColumnsStart: 2,
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
          label: 'Code*',
          allowEmpty: false,
          validator: function (value, callback) {
            callback(!!value && value.length <= fieldConstraints.station.code.maxLength)
          },
          rule: `Code must be unique and ${fieldConstraints.station.code.maxLength} or fewer characters`,
          width: '100px'
        },
        {
          prop: 'latitude',
          label: 'Latitude*',
          allowEmpty: false,
          validator: function (value, callback) {
            callback(!!value && isNumber(value) && +value > -90 && +value < 90)
          },
          rule: 'Latitude must be a decimal number between -90 and 90',
          type: 'numeric',
          width: '80px'
        },
        {
          prop: 'longitude',
          label: 'Longitude*',
          allowEmpty: false,
          validator: function (value, callback) {
            callback(!!value && isNumber(value) && +value > -180 && +value < 180)
          },
          rule: 'Longitude must be a decimal number between -180 and 180',
          type: 'numeric',
          width: '80px'
        },
        {
          prop: 'timezone',
          label: 'Timezone*',
          allowEmpty: false,
          rule: `Timezone must be one of: [${timezoneOptions.map(d => `'${d.value}'`).join(', ')}]`,
          source: timezoneOptions.map(d => d.value),
          type: 'dropdown',
          width: '100px'
        },
        {
          prop: 'waterbody_type',
          label: 'Waterbody Type',
          rule: `Waterbody Type must be one of: [${waterbodyTypeOptions.map(d => `'${d.value}'`).join(', ')}]`,
          source: waterbodyTypeOptions.map(d => d.value),
          type: 'dropdown'
        },
        {
          prop: 'waterbody_name',
          label: 'Waterbody Name',
          validator: function (value, callback) {
            callback(!value || value.length <= fieldConstraints.station.waterbodyName.maxLength)
          },
          rule: `Waterbody Name must be ${fieldConstraints.station.waterbodyName.maxLength} characters or less`,
          width: '150px'
        },
        {
          prop: 'description',
          label: 'Description',
          validator: function (value, callback) {
            callback(!value || value.length <= fieldConstraints.station.description.maxLength)
          },
          rule: `Description must be ${fieldConstraints.station.description.maxLength} characters or less`,
          width: '150px'
        },
        {
          prop: 'placement',
          label: 'Placement',
          rule: `Placement must be one of: [${placementOptions.map(d => `'${d.value}'`).join(', ')}]`,
          source: placementOptions.map(d => d.value),
          type: 'dropdown'
        },
        {
          prop: 'active',
          label: 'Active',
          rule: `Active must be one of: [${booleanOptions.map(d => d.value).map(d => `'${d}'`).join(', ')}]`,
          source: booleanOptions.map(d => d.value),
          type: 'dropdown',
          width: '80px'
        },
        {
          prop: 'mixed',
          label: 'Well-mixed',
          rule: `Well-mixed must be one of: [${booleanOptions.map(d => d.value).map(d => `'${d}'`).join(', ')}]`,
          source: booleanOptions.map(d => d.value),
          type: 'dropdown'
        },
        {
          prop: 'reference',
          label: 'Reference URL',
          width: '150px'
        },
        {
          prop: 'private',
          label: 'Private',
          rule: `Private must be one of: [${booleanOptions.map(d => d.value).map(d => `'${d}'`).join(', ')}]`,
          source: booleanOptions.map(d => d.value),
          type: 'dropdown'
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
      maxInvalidCellErrors: 3
    }
  },
  computed: {
    ...mapGetters({
      organizations: 'manage/organizations',
      defaultOrganization: 'manage/organization'
    }),
    failedStations () {
      const copy = this.stations.slice()
      copy.forEach((d, i) => {
        d.$row = i
      })
      return copy.filter(d => d.status === 'FAILED')
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
    initTable () {
      this.invalidCells = []
      this.error = null
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
          this.stations[i].error = this.$errorMessage(err) || 'Unknown error'
        }
        this.renderHot()
      }
      if (this.failedStations.length === 0) {
        evt.$emit('notify', 'New stations have been successfully imported', 'success')
        return this.$router.push({ name: 'manageStations' })
      } else {
        // if (this.failedStations.length > 0) {
        //   this.error = `Failed to save ${this.failedStations.length} station(s). Fix the errors listed above, and click Submit again. Any stations that were successfully saved will be skipped in future attempts.`
        // }
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
        private: station.private ? parseBooleanOption(station.private) : false
      }
      delete payload.status
      delete payload.error

      return await this.$http.restricted.post(`/organizations/${organizationId}/stations`, payload)
    },
    removeSavedStations () {
      this.stations = this.stations.filter(d => d.status !== 'SUCCESS')
    }
  }
}
</script>

<style>

</style>
