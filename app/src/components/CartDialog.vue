<template>
  <!-- eslint-disable vue/valid-v-slot -->
  <v-dialog
    v-model="dialog"
    scrollable
    max-width="1200"
    @keydown.esc="close"
    @click:outside="resetRecaptcha"
    style="z-index:3000"
  >
    <v-card>
      <v-toolbar flat dense color="grey lighten-2">
        <v-toolbar-title class="text-h6">
          Download Cart
        </v-toolbar-title>
        <v-spacer></v-spacer>
      </v-toolbar>
      <v-card-text class="mt-2 mb-0 black--text px-4">
        <v-form ref="form" @submit.prevent="download" :disabled="loading">
          <div class="d-flex">
            <div class="text-h6 mb-2">Selected Stations</div>
            <v-spacer></v-spacer>
            <v-btn
              outlined
              class="ml-4"
              color="error"
              small
              @click.native="clearCart"
            >
              <v-icon small left>mdi-delete</v-icon> Clear Cart
            </v-btn>
          </div>
          <v-data-table
            ref="table"
            :headers="headers"
            :items="stations"
            :options="{ itemsPerPage: 5 }"
            no-data-text="Cart is Empty"
            dense
          >
            <template v-slot:item.series_start_datetime="{ item }">
              <span v-if="item.series_start_datetime">
                {{ item.series_start_datetime | timestamp('DD', item.timezone) }}
              </span>
            </template>
            <template v-slot:item.series_end_datetime="{ item }">
              <span v-if="item.series_end_datetime">
                {{ item.series_end_datetime | timestamp('DD', item.timezone) }}
              </span>
            </template>
            <template v-slot:item.remove="{ item }">
              <v-btn small icon @click="removeStation(item)" title="Remove from cart">
                <v-icon small>mdi-delete</v-icon>
              </v-btn>
            </template>
            <template v-slot:footer.prepend>
              <DownloadButton
                @click="downloadStations"
                title="Download stations metadata"
                :disabled="loading"
                text="Download Stations Metadata"
              />
            </template>
          </v-data-table>

          <v-divider class="my-4"></v-divider>

          <div class="text-h6">Data Types</div>
          <div class="secondary--text">Select at least one</div>
          <div>
            <v-checkbox
              label="Continuous Timeseries (Daily Values Only)"
              v-model="types.daily"
              dense
              hide-details
            ></v-checkbox>
            <v-checkbox
              label="Discrete Timeseries"
              v-model="types.discrete"
              dense
              hide-details
            ></v-checkbox>
            <v-checkbox
              label="Vertical Profiles"
              v-model="types.profiles"
              dense
              hide-details
            ></v-checkbox>
          </div>

          <v-divider class="my-4"></v-divider>

          <div class="text-h6">Time Period</div>
          <div class="secondary--text">Leave blank to download all data</div>
          <v-row>
            <v-col cols="12" md="3">
              <v-menu
                v-model="period.start.show"
                :close-on-content-click="false"
                :nudge-right="40"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="period.start.value"
                    label="Start Date"
                    prepend-icon="mdi-calendar"
                    readonly
                    clearable
                    v-bind="attrs"
                    v-on="on"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="period.start.value"
                  @input="period.start.show = false"
                ></v-date-picker>
              </v-menu>
            </v-col>
            <v-col cols="12" md="3">
              <v-menu
                v-model="period.end.show"
                :close-on-content-click="false"
                :nudge-right="40"
                transition="scale-transition"
                offset-y
                min-width="auto"
              >
                <template v-slot:activator="{ on, attrs }">
                  <v-text-field
                    v-model="period.end.value"
                    :rules="period.end.rules"
                    label="End Date"
                    prepend-icon="mdi-calendar"
                    readonly
                    clearable
                    v-bind="attrs"
                    v-on="on"
                  ></v-text-field>
                </template>
                <v-date-picker
                  v-model="period.end.value"
                  @input="period.end.show = false"
                ></v-date-picker>
              </v-menu>
            </v-col>
          </v-row>

          <v-divider class="my-4"></v-divider>

          <div class="text-h6">Email Address</div>
          <div class="secondary--text">Provide your email address to receive the data download.</div>
          <v-row>
            <v-col cols="12" md="4">
              <v-text-field
                v-model="email.value"
                :rules="email.rules"
                label="Email Address"
                required
                outlined
                validate-on-blur
                class="mt-4"
              ></v-text-field>
            </v-col>
          </v-row>

          <vue-recaptcha
            :sitekey="recaptcha.siteKey"
            @verify="onVerifyRecaptcha"
            @expired="onExpiredRecaptcha"
            ref="recaptcha"
            class="mb-4"
          ></vue-recaptcha>

          <v-divider class="my-4"></v-divider>

          <Alert v-if="error" type="error" title="Failed to Download Data" class="">
            {{ error }}
          </Alert>

          <div class="d-flex mt-4">
            <v-btn
              color="primary"
              @click="submit"
              :loading="loading"
            >
              Submit
            </v-btn>
            <v-spacer></v-spacer>
            <v-btn
              text
              @click.native="close"
            >
              Close
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script>
import { VueRecaptcha } from 'vue-recaptcha'
import { email } from '@/lib/validators'
import { writeStationsFile } from 'aktemp-utils/downloads'
import { mapGetters } from 'vuex'
import evt from '@/events'

export default {
  name: 'CartDialog',
  components: { VueRecaptcha },
  data () {
    return {
      dialog: false,
      resolve: null,
      reject: null,
      loading: false,
      error: null,
      recaptcha: {
        response: null,
        siteKey: process.env.VUE_APP_RECAPTCHA_SITE_KEY
      },
      email: {
        value: null,
        rules: [
          v => !!v || 'Email is required',
          v => email(v) || 'Email must be a valid email address'
        ]
      },
      period: {
        start: {
          value: null,
          show: false
        },
        end: {
          value: null,
          show: false,
          rules: [
            v => !v || !this.period.start.value || v >= this.period.start.value || 'End cannot be before start'
          ]
        }
      },
      types: {
        daily: true,
        discrete: true,
        profiles: true
      },
      headers: [
        {
          text: 'Provider',
          value: 'provider_code'
        },
        {
          text: 'Station',
          value: 'code'
        },
        {
          text: 'Waterbody',
          value: 'waterbody_name'
        },
        {
          text: 'Start',
          value: 'series_start_datetime'
        },
        {
          text: 'End',
          value: 'series_end_datetime',
          filter: () => true
        },
        {
          text: '# Days',
          value: 'series_count_days',
          width: '120px'
        },
        {
          text: '# Profiles',
          value: 'profiles_count',
          width: '120px'
        },
        {
          text: '',
          value: 'remove',
          width: '20px',
          class: 'text-center'
        }
      ]
    }
  },
  computed: {
    ...mapGetters('cart', ['stations']),
    ...mapGetters('explorer', ['providers'])
  },

  methods: {
    open () {
      this.dialog = true
      this.error = null
      this.loading = false
      this.types.daily = true
      this.types.discrete = true
      this.types.profiles = true
      this.period.start.value = null
      this.period.end.value = null
      return new Promise((resolve, reject) => {
        this.resolve = resolve
        this.reject = reject
      })
    },
    close () {
      this.dialog = false
      this.resetRecaptcha()
    },
    clearCart () {
      this.$store.dispatch('cart/clear')
    },
    removeStation (station) {
      this.$store.dispatch('cart/removeStation', station)
    },
    validate () {
      if (!this.$refs.form.validate()) {
        throw new Error('Fix the form errors above.')
      } else if (this.stations.length === 0) {
        throw new Error('Cart is empty. Use the Stations Table on the Data Explorer map to add stations to your cart.')
      } else if (!this.recaptcha.response) {
        throw new Error('reCAPTCHA is required, please check the box above.')
      } else if (!this.types.daily && !this.types.discrete && !this.types.profiles) {
        throw new Error('Please select at least one type of data')
      }
    },
    async submit () {
      this.loading = true

      try {
        this.validate()

        const payload = {
          'g-recaptcha-response': this.recaptcha.response,
          email: this.email.value,
          stationIds: this.stations.map(d => d.id),
          types: this.types,
          period: {
            start: this.period.start.value,
            end: this.period.end.value
          }
        }

        await this.$http.public.post('/downloads', payload)
        evt.$emit('notify', 'Download request has been submitted. Check your email in a few minutes.', 'success')
        this.clearCart()
        this.close()
      } catch (err) {
        console.log(err)
        this.error = this.$errorMessage(err)
        // this.resetRecaptcha()
      } finally {
        this.loading = false
      }
    },
    onVerifyRecaptcha (response) {
      this.recaptcha.response = response
    },
    onExpiredRecaptcha () {
      this.error = 'reCAPTCHA has expired. Please try again.'
      this.resetRecaptcha()
    },
    resetRecaptcha () {
      this.$refs.recaptcha.reset() // Direct call reset method
      this.recaptcha.response = null
    },
    downloadStations () {
      const providerIds = new Set(this.stations.map(d => d.provider_id))
      const providers = this.providers.filter(d => providerIds.has(d.id))
      const body = writeStationsFile(providers, this.stations)
      this.$download(body, 'AKTEMP-explorer-stations.csv')
    }
  }
}
</script>
