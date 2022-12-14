<template>
  <v-card elevation="2">
    <v-toolbar flat dense>
      <v-toolbar-title>
        <span class="text-h6">Upload Data File</span>
      </v-toolbar-title>
      <v-spacer></v-spacer>
      <v-btn text small @click="$router.push({ name: 'manageFiles' })">
        <v-icon small left>mdi-chevron-left</v-icon> Back to Files
      </v-btn>
    </v-toolbar>
    <v-divider></v-divider>

    <v-stepper v-model="step">
      <v-stepper-header>
        <v-stepper-step step="1" :complete="step > 1">
          File
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step step="2" :complete="step > 2">
          Type
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step step="3" :complete="step > 3">
          Station
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step step="4" :complete="step > 4">
          Timestamps
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step step="5" :complete="step > 5">
          Temperatures
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step step="6" :complete="step > 6">
          Depth
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step step="7" :complete="step > 7">
          Metadata
        </v-stepper-step>

        <v-divider></v-divider>

        <v-stepper-step step="8">
          Finish
        </v-stepper-step>
      </v-stepper-header>

      <v-row>
        <v-col cols="12" lg="6">
          <v-stepper-items class="body-1">
            <!-- FILE -->
            <v-stepper-content step="1">
              <v-form ref="fileForm" :disabled="file.loading">
                <div>
                  <div class="text-h6 mb-4">Data File</div>
                  <ul class="mb-8">
                    <li>Must be in <strong>comma-separated values (CSV)</strong> format.</li>
                    <li>May contain extra lines above the header row containing column names. If so, specify how many lines to skip when reading the file, but <strong>do not skip the column names.</strong></li>
                  </ul>
                  <v-file-input
                    ref="fileInput"
                    v-model="file.selected"
                    label="Select Data File (CSV)"
                    :rules="file.rules"
                    truncate-length="200"
                    prepend-icon="mdi-file-delimited-outline"
                    hint="Must be in comma-separated values (CSV) format."
                    persistent-hint
                    @change="loadFile"
                    class="mb-4"
                    outlined
                  >
                  </v-file-input>

                  <v-text-field
                    v-model="config.file_skip"
                    label="# Lines to Skip"
                    type="number"
                    prepend-icon="mdi-table-row-height"
                    hint="Number of lines above column names to skip when reading file."
                    persistent-hint
                    outlined
                    @input="loadFile"
                  ></v-text-field>
                </div>

                <Alert v-if="file.error" type="error" title="File Error" class="mt-4">
                  <table class="mt-4" v-if="file.selected">
                    <tbody>
                      <tr v-if="file.selected">
                        <td class="text-right pr-2">Filename:</td>
                        <td class="font-weight-bold">{{ file.selected.name }}</td>
                      </tr>
                      <tr v-if="file.selected">
                        <td class="text-right pr-2">File Size:</td>
                        <td class="font-weight-bold">{{ file.selected.size | prettyBytes(1) }}</td>
                      </tr>
                      <tr v-if="file.parsed && file.parsed.meta.fields">
                        <td class="text-right pr-2" style="vertical-align:top">Columns:</td>
                        <td class="font-weight-bold">
                          {{ file.parsed.meta.fields.map(d => `"${d}"`).join(', ')}}
                        </td>
                      </tr>
                      <tr v-if="file.parsed">
                        <td class="text-right pr-2"># Rows:</td>
                        <td class="font-weight-bold">{{ file.parsed.data.length.toLocaleString() }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <div class="mt-4">{{ file.error }}</div>
                </Alert>

                <Alert
                  v-if="!file.error && !file.loading && file.parsed"
                  title="File Loaded Successfully"
                  type="success"
                  class="body-2 my-4"
                >
                  <table class="mt-4">
                    <tbody>
                      <tr>
                        <td class="text-right pr-2">Filename:</td>
                        <td class="font-weight-bold">{{ file.selected.name }}</td>
                      </tr>
                      <tr>
                        <td class="text-right pr-2">File Size:</td>
                        <td class="font-weight-bold">{{ file.selected.size | prettyBytes(1) }}</td>
                      </tr>
                      <tr>
                        <td class="text-right pr-2" style="vertical-align:top">Columns:</td>
                        <td class="font-weight-bold">
                          {{ file.parsed.meta.fields.map(d => `"${d}"`).join(', ')}}
                        </td>
                      </tr>
                      <tr>
                        <td class="text-right pr-2"># Rows:</td>
                        <td class="font-weight-bold">{{ file.parsed.data.length.toLocaleString() }}</td>
                      </tr>
                    </tbody>
                  </table>
                  <p class="mt-4 mb-0">
                    Verify this information is correct then click <code>Continue</code>.
                  </p>
                </Alert>
                <v-divider class="my-4"></v-divider>
                <div class="d-flex mt-4 mb-2">
                  <v-btn text class="mr-4 px-4">
                    <v-icon left>mdi-chevron-left</v-icon> Previous
                  </v-btn>
                  <v-btn
                    color="primary"
                    class="mr-4 px-4"
                    @click="nextFile"
                    :disabled="file.loading"
                    :loading="file.loading"
                  >
                    Continue <v-icon right>mdi-chevron-right</v-icon>
                  </v-btn>

                  <v-spacer></v-spacer>

                  <v-btn text @click="cancel">
                    Cancel
                  </v-btn>
                </div>
              </v-form>
            </v-stepper-content>

            <!-- TYPE -->
            <v-stepper-content step="2">
              <div>
                <div class="text-h6">Dataset Type</div>
                <p>What kind of data does this file contain?</p>
                <ul class="my-4">
                  <li><strong>Timeseries</strong> reflect temperature <strong>changes over time</strong> at a fixed location and depth.</li>
                  <li><strong>Vertical profiles</strong> reflect temperature <strong>changes over depth</strong> at a fixed location and at a single point in time.</li>
                </ul>
                <v-btn-toggle v-model="config.file_type" class="mb-4" @change="resetType()">
                  <v-btn value="SERIES">
                    <v-icon left>mdi-chart-line-variant</v-icon>
                    Timeseries
                  </v-btn>
                  <v-btn value="PROFILES">
                    <v-icon left>mdi-arrow-expand-down</v-icon>
                    Profiles
                  </v-btn>
                </v-btn-toggle>

                <div v-if="config.file_type === 'SERIES'">
                  <div class="text-h6 mt-4">Timeseries Interval</div>
                  <p>What is the type of timeseries interval?</p>
                  <ul class="my-4">
                    <li><strong>Continuous</strong> timeseries are at <strong>regular time (e.g. 15 minutes)</strong> intervals using a data logger.</li>
                    <li><strong>Discrete</strong> timeseries are at <strong>irregular or semi-regular (e.g. weekly)</strong> intervals using a hand-held probe.</li>
                  </ul>
                  <v-btn-toggle v-model="config.interval" class="mb-4" @change="resetType()">
                    <v-btn value="CONTINUOUS">
                      <v-icon left>mdi-minus</v-icon>
                      Continuous
                    </v-btn>
                    <v-btn value="DISCRETE">
                      <v-icon left>mdi-dots-horizontal</v-icon>
                      Discrete
                    </v-btn>
                  </v-btn-toggle>
                </div>
              </div>

              <Alert type="error" title="Dataset Type Error" v-if="type.error" class="my-4">
                {{ type.error || 'Unknown error' }}
              </Alert>

              <v-divider class="my-4"></v-divider>
              <div class="d-flex mt-4 mb-2">
                <v-btn text class="mr-4 px-4" @click="step -= 1">
                  <v-icon left>mdi-chevron-left</v-icon> Previous
                </v-btn>
                <v-btn color="primary" class="mr-4 px-4" @click="nextType">
                  Continue <v-icon right>mdi-chevron-right</v-icon>
                </v-btn>

                <v-spacer></v-spacer>

                <v-btn text @click="cancel">
                  Cancel
                </v-btn>
              </div>
            </v-stepper-content>

            <!-- STATION -->
            <v-stepper-content step="3">
              <v-form ref="stationForm" @input="resetStation()">
                <div>
                  <div class="text-h6">Station</div>

                  <div class="mb-8">
                    <p>Does this file contain data from one station or multiple stations?</p>

                    <v-btn-toggle v-model="station.mode" @change="resetStation()">
                      <v-btn value="STATION">
                        <v-icon left>mdi-map-marker</v-icon>
                        One Station
                      </v-btn>
                      <v-btn value="COLUMN">
                        <v-icon left>mdi-map-marker-multiple</v-icon>
                        Multiple Stations
                      </v-btn>
                    </v-btn-toggle>
                  </div>

                  <div v-if="station.mode === 'STATION'">
                    <div>
                      <p>Which station does this file contain data for?</p>
                      <v-autocomplete
                        v-model="config.station_code"
                        :items="stations"
                        :rules="station.rules"
                        item-text="code"
                        item-value="code"
                        placeholder="Select station"
                        outlined
                        clearable
                      ></v-autocomplete>
                    </div>
                  </div>
                  <div v-else-if="station.mode === 'COLUMN'">
                    <p>Which column contains the station codes? Values must match codes <em>exactly</em> and are case sensitive.</p>
                    <v-select
                      v-model="config.station_column"
                      :items="fileColumns"
                      :rules="station.column.rules"
                      placeholder="Select station column"
                      outlined
                      clearable
                    ></v-select>
                  </div>
                </div>

                <Alert type="error" title="Station Error" v-if="station.error" class="my-4">
                  {{ station.error || 'Unknown error' }}
                </Alert>

                <v-divider class="my-4"></v-divider>
                <div class="d-flex mt-4 mb-2">
                  <v-btn text class="mr-4 px-4" @click="step -= 1">
                    <v-icon left>mdi-chevron-left</v-icon> Previous
                  </v-btn>
                  <v-btn color="primary" class="mr-4 px-4" @click="nextStation" :loading="station.loading">
                    Continue <v-icon right>mdi-chevron-right</v-icon>
                  </v-btn>

                  <v-spacer></v-spacer>

                  <v-btn text @click="cancel">
                    Cancel
                  </v-btn>
                </div>
              </v-form>
            </v-stepper-content>

            <!-- TIMESTAMP -->
            <v-stepper-content step="4">
              <v-form ref="timestampForm">
                <div>
                  <div class="text-h6">Timestamp Columns</div>

                  <!-- COLUMNS -->
                  <div class="mb-8">
                    <p>Are dates and times in the same column or separate columns?</p>

                    <v-btn-toggle v-model="timestamp.columns.separate" @change="resetTimestamp()">
                      <v-btn :value="false">
                        <v-icon left>mdi-format-align-justify</v-icon>
                        One Column (Date+Time)
                      </v-btn>
                      <v-btn :value="true">
                        <v-icon left>mdi-format-columns</v-icon>
                        Two Columns (Date, Time)
                      </v-btn>
                    </v-btn-toggle>
                  </div>

                  <div v-if="!timestamp.columns.separate">
                    <div>
                      <p>Which column contains the dates and times?</p>
                      <v-select
                        v-model="config.datetime_column"
                        :items="fileColumns"
                        :rules="timestamp.columns.date.rules"
                        outlined
                        @input="resetTimestamp()"
                      ></v-select>
                    </div>
                  </div>
                  <div v-else>
                    <div>
                      <p>Which column contains the dates?</p>
                      <v-select
                        v-model="config.datetime_column"
                        :items="fileColumns"
                        :rules="timestamp.columns.date.rules"
                        outlined
                        @input="resetTimestamp()"
                      ></v-select>
                    </div>
                    <div>
                      <p>Which column contains the times?</p>
                      <v-select
                        v-model="config.time_column"
                        :items="fileColumns"
                        :rules="timestamp.columns.time.rules"
                        outlined
                        @input="resetTimestamp()"
                      ></v-select>
                    </div>
                  </div>

                  <Alert
                    v-if="timestampValue"
                    type="success"
                    title="Raw Timestamp"
                  >
                    <p>Verify the raw value below matches the first timestamp in the file. If this is incorrect, select a different column or check your file.</p>
                      <table dense class="text-monospace">
                        <tbody>
                          <tr>
                            <td class="text-right">Raw:</td>
                            <td class="pl-4">{{ timestampValue }}</td>
                          </tr>
                        </tbody>
                      </table>
                  </Alert>

                  <!-- FORMAT -->
                  <div v-if="timestampValue">
                    <v-divider class="my-4"></v-divider>
                    <div class="text-h6">Timestamp Format</div>
                    <p>Specify the date and time format. If possible, the form will automatically guess the correct format. The same format must be used in all rows.</p>
                    <v-checkbox
                      v-model="timestamp.format.isISO"
                      @change="resetTimestamp()"
                    >
                      <template v-slot:label>
                        <div>Use ISO 8601 Format: <span class="text--secondary text-monospace">yyyy-MM-ddTHH:mm:ss.uZ</span></div>
                      </template>
                    </v-checkbox>
                    <v-row>
                      <v-col cols="12" lg="6">
                        <v-text-field
                          v-model="timestamp.format.date.value"
                          :rules="timestamp.format.date.rules"
                          label="Date Format"
                          outlined
                          :disabled="timestamp.format.isISO"
                          @input="resetTimestamp()"
                        ></v-text-field>
                      </v-col>
                      <v-col cols="12" lg="6">
                        <v-text-field
                          v-model="timestamp.format.time.value"
                          :rules="timestamp.format.time.rules"
                          label="Time Format"
                          outlined
                          :disabled="timestamp.format.isISO"
                          @input="resetTimestamp()"
                        ></v-text-field>
                      </v-col>
                    </v-row>

                    <Alert
                      v-if="timestamp.format.unknown && !timestampParsed"
                      type="warning"
                      title="Unknown Timestamp Format"
                    >
                      The date and time format could not be automatically determined. See instructions below for specifying formats.
                    </Alert>

                    <Alert
                      v-if="timestampParsed"
                      type="success"
                      title="Parsed Timestamp"
                      dismissible
                    >
                      <p>Verify the raw timestamp was correctly parsed. The parsed value will be shown in ISO format, but may not be in the correct timezone (see next section).</p>
                      <table dense class="text-monospace">
                        <tbody>
                          <tr>
                            <td class="text-right">Raw:</td>
                            <td class="pl-4">{{ timestampValue }}</td>
                          </tr>
                          <tr>
                            <td class="text-right">Parsed:</td>
                            <td class="pl-4">{{ timestampParsed | timestamp('ISO', 'UTC') }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Alert>
                    <Alert
                      v-else
                      type="error"
                      title="Failed to Parse Timestamp"
                    >
                      <p>Unable to parse the first timestamp in the file using the specified date and time formats.</p>

                      <table dense class="text-monospace">
                        <tbody>
                          <tr>
                            <td class="text-right">Raw:</td>
                            <td class="pl-4">{{ timestampValue }}</td>
                          </tr>
                          <tr>
                            <td class="text-right">Format:</td>
                            <td class="pl-4">{{ timestampFormat || 'N/A' }}</td>
                          </tr>
                        </tbody>
                      </table>

                      <p class="mt-4">First, check that the first timestamp in the file was correctly extracted using the selected column(s) above.</p>
                      <p>If the raw timestamp is correct, then you will need to specify the date and time formats. See the <a href="https://moment.github.io/luxon/#/parsing?id=table-of-tokens" target="_blank">luxon documentation</a> for a table of format tokens (capitalization is important). Alternatively, you can reformat the timestamps in this file using a more common format and try again.</p>
                      <p>Here are some common date and time formats:<br><i>Note: this is not an exhaustive list, see the link above for all available tokens</i></p>
                      <v-simple-table dense class="ml-n4">
                        <thead class="font-weight-bold text-left">
                          <tr>
                            <td style="width:50%">Date String</td>
                            <td>Date Format</td>
                          </tr>
                        </thead>
                        <tbody class="text-monospace">
                          <tr>
                            <td>10/2/2022</td>
                            <td>M/d/yyyy</td>
                          </tr>
                          <tr>
                            <td>10/2/22</td>
                            <td>M/d/yy</td>
                          </tr>
                          <tr>
                            <td>October 2, 2022</td>
                            <td>MMMM d, yyyy</td>
                          </tr>
                          <tr>
                            <td>Oct 2, 2022</td>
                            <td>MMM d, yyyy</td>
                          </tr>
                          <tr>
                            <td>2-Oct-22</td>
                            <td>d-MMM-yy</td>
                          </tr>
                        </tbody>
                      </v-simple-table>
                      <v-simple-table dense class="ml-n4 mt-4">
                        <thead class="font-weight-bold text-left">
                          <tr>
                            <td style="width:50%">Time String</td>
                            <td>Time Format</td>
                          </tr>
                        </thead>
                        <tbody class="text-monospace">
                          <tr>
                            <td>3:52</td>
                            <td>H:mm</td>
                          </tr>
                          <tr>
                            <td>3:52:00</td>
                            <td>H:mm:ss</td>
                          </tr>
                          <tr>
                            <td>03:52:00.000</td>
                            <td>HH:mm:ss.u</td>
                          </tr>
                          <tr>
                            <td>3:52 PM</td>
                            <td>h:mm a</td>
                          </tr>
                          <tr>
                            <td>3:52:00 PM</td>
                            <td>h:mm:ss a</td>
                          </tr>
                        </tbody>
                      </v-simple-table>
                    </Alert>
                  </div>

                  <!-- TIMEZONE -->
                  <div v-if="timestampParsed">
                    <v-divider class="my-4"></v-divider>
                    <div class="text-h6">Timezone Adjustment</div>

                    <p>
                      How should the timezone of the timestamps be determined?
                    </p>
                    <v-radio-group v-model="timestamp.timezone.mode" @change="resetTimestamp()">
                      <v-radio
                        value="NONE"
                      >
                        <template v-slot:label>
                          <span>All timestamps are in <strong>UTC</strong> or <strong>contain a UTC offset</strong> (e.g. each timestamp ends in a UTC offset such as '-0800')</span>
                        </template>
                      </v-radio>
                      <v-radio
                        value="LOCAL"
                      >
                        <template v-slot:label>
                          <span>All timestamps are in either <strong>local daylight or standard time</strong> of the associated station</span>
                        </template>
                      </v-radio>
                      <v-radio
                        value="FIXED"
                      >
                        <template v-slot:label>
                          <span>All timestamps have the same <strong>fixed UTC offset</strong> (choose from list below)</span>
                        </template>
                      </v-radio>
                      <v-radio
                        value="COLUMN"
                        label=""
                      >
                        <template v-slot:label>
                          <span>UTC offset provided in a <strong>separate column</strong> (choose from list below)</span>
                        </template>
                      </v-radio>
                    </v-radio-group>

                    <Alert
                      v-if="timestamp.timezone.mode === 'LOCAL' && config.file_type === 'SERIES' && config.interval === 'CONTINUOUS'"
                      type="warning"
                      title="Daylight Savings Transitions Not Supported"
                    >
                      <p>
                        When a continuous timeseries is uploaded in the local timezone, AKTEMP assumes that the timestamps <strong>do not account for daylight savings time transitions</strong> (which is also true for most data loggers).
                      </p>
                      <p>
                        For each timeseries in this file, all timestamps will be adjusted using either the local daylight savings or standard time of the associated station depending on which occurred <strong>at the time of the first timestamp</strong>. This assumes the logger clock was set just prior to deployment.
                      </p>
                      <p>
                        For example, if the first timestamp occurs during daylight savings time then all subsequent timestamps will be adjusted by the same UTC offset (e.g. UTC-8 for AKDT).
                      </p>
                      <p class="mb-0">
                        If the logger clock was not correctly set to the local daylight savings or standard time at the start of the deployment, then choose the <strong>fixed UTC offset</strong> option above and then select the correct offset.
                      </p>
                    </Alert>

                    <v-select
                      v-if="timestamp.timezone.mode === 'FIXED'"
                      v-model="timestamp.timezone.utcOffset.selected"
                      :items="timestamp.timezone.utcOffset.options"
                      :rules="timestamp.timezone.utcOffset.rules"
                      placeholder="Select UTC Offset"
                      item-text="label"
                      item-value="value"
                      hint="All timestamps must have the same UTC offset"
                      persistent-hint
                      outlined
                      clearable
                      class="mb-4"
                      @change="resetTimestamp()"
                    ></v-select>

                    <v-select
                      v-if="timestamp.timezone.mode === 'COLUMN'"
                      v-model="timestamp.timezone.column.selected"
                      :items="fileColumns"
                      :rules="timestamp.timezone.column.rules"
                      placeholder="Select UTC Offset Column"
                      hint="Column must contain UTC offset in hours (e.g., '-9' for AKST)"
                      persistent-hint
                      outlined
                      clearable
                      class="mb-4"
                      @change="resetTimestamp()"
                    ></v-select>

                    <Alert
                      v-if="timestamp.timezone.mode === 'COLUMN'"
                      type="warning"
                      title="UTC Offset Column"
                    >
                      This column should contain the UTC offset indicating the number of hours relative to UTC (e.g., UTC-8 for AKDT). Each value in this column should be an integer (e.g., '-8'), and may also include the 'UTC' prefix (e.g. 'UTC-8').
                    </Alert>
                  </div>

                  <div v-if="timestampUtc">
                    <v-divider class="my-4"></v-divider>
                    <Alert
                      type="success"
                      title="Verify Final Timestamps"
                    >
                      Verify that the first <code>raw</code> timestamp in the file was correctly <code>parsed</code> and <code>adjusted</code>. The <code>final</code> values in both ISO and local formats should show the correct date and time in the timezone of the associated station. If these are incorrect, check the selected options above.
                      <table dense class="text-monospace mt-4">
                        <tbody>
                          <tr>
                            <td class="text-right">Raw:</td>
                            <td class="pl-4">{{ timestampValue }}</td>
                          </tr>
                          <tr>
                            <td class="text-right">Format:</td>
                            <td class="pl-4">{{ timestampFormat }}</td>
                          </tr>
                          <tr>
                            <td class="text-right">Parsed:</td>
                            <td class="pl-4">{{ timestampParsed | timestamp('ISO', 'UTC') }}</td>
                          </tr>
                          <tr>
                            <td colspan="2"><v-divider></v-divider></td>
                          </tr>
                          <tr>
                            <td class="text-right">UTC Offset:</td>
                            <td class="pl-4">{{ timestampUtcOffset === 'UTC' ? 'None' : timestampUtcOffset }}</td>
                          </tr>
                          <tr>
                            <td class="text-right">Adjusted:</td>
                            <td class="pl-4">{{ timestampUtc | timestamp('ISO', 'UTC') }}</td>
                          </tr>
                          <tr>
                            <td colspan="2"><v-divider></v-divider></td>
                          </tr>
                          <tr>
                            <td class="text-right">Timezone:</td>
                            <td class="pl-4">{{ timestamp.timezone.station.timezone }} (Station: {{ timestamp.timezone.station.code }})</td>
                          </tr>
                          <tr>
                            <td class="text-right">Final (ISO):</td>
                            <td class="pl-4">{{ timestampUtc | timestamp('ISO', timestamp.timezone.station.timezone) }}</td>
                          </tr>
                          <tr>
                            <td class="text-right">Final (Local):</td>
                            <td class="pl-4">{{ timestampUtc | timestamp('ff ZZZZ', timestamp.timezone.station.timezone) }}</td>
                          </tr>
                        </tbody>
                      </table>
                    </Alert>
                  </div>
                </div>

                <Alert type="error" title="Timestamp Error" v-if="timestamp.error" class="my-4">
                  <div v-html="timestamp.error || 'Unknown error'"></div>
                </Alert>

                <v-divider class="my-4"></v-divider>
                <div class="d-flex mt-4 mb-2">
                  <v-btn text class="mr-4 px-4" @click="step -= 1">
                    <v-icon left>mdi-chevron-left</v-icon> Previous
                  </v-btn>
                  <v-btn color="primary" class="mr-4 px-4" @click="nextTimestamp" :loading="timestamp.loading">
                    Continue <v-icon right>mdi-chevron-right</v-icon>
                  </v-btn>

                  <v-spacer></v-spacer>

                  <v-btn text @click="cancel">
                    Cancel
                  </v-btn>
                </div>
              </v-form>
            </v-stepper-content>

            <!-- TEMPERATURE -->
            <v-stepper-content step="5">
              <v-form ref="temperatureForm" @input="resetTemperature()">
                <div>
                  <div class="text-h6">Temperature Values</div>

                  <div>
                    <p>Which column contains the temperature values?</p>
                    <v-select
                      v-model="config.temperature_column"
                      :items="fileColumns"
                      :rules="temperature.column.rules"
                      outlined
                    ></v-select>
                  </div>

                  <p>What are the units?</p>
                  <v-select
                    v-model="config.temperature_units"
                    :items="temperature.units.options"
                    :rules="temperature.units.rules"
                    item-text="label"
                    item-value="value"
                    outlined
                  ></v-select>

                  <div>
                    <p>
                      What are the missing value indicators? (Optional)<br>
                      <span class="text--secondary"></span>
                    </p>
                    <v-combobox
                      v-model="temperature.missing.selected"
                      :items="temperature.missing.options"
                      label="Select or enter missing value indicators"
                      hint="Value not in the list? Type it in and press enter."
                      persistent-hint
                      multiple
                      outlined
                      small-chips
                      deletable-chips
                      clearable
                    ></v-combobox>
                  </div>

                  <div class="mt-2" v-if="config.file_type === 'SERIES'">
                    <p>
                      Which column contains QAQC flags? (Optional)
                    </p>
                    <div class="text-center">
                      <v-select
                        v-model="config.flag_column"
                        :items="fileColumns"
                        :rules="temperature.flagColumn.rules"
                        outlined
                        hint="Flags should only indicate inaccurate or erroneous values."
                        persistent-hint
                        clearable
                      ></v-select>
                    </div>
                  </div>
                </div>

                <Alert v-if="temperature.error" type="error" title="Temperatures Error" class="my-4">
                  {{ temperature.error || 'Unknown error' }}
                </Alert>

                <v-divider class="my-4"></v-divider>
                <div class="d-flex mt-4 mb-2">
                  <v-btn text class="mr-4 px-4" @click="step -= 1">
                    <v-icon left>mdi-chevron-left</v-icon> Previous
                  </v-btn>
                  <v-btn color="primary" class="mr-4 px-4" @click="nextTemperature" :loading="temperature.loading">
                    Continue <v-icon right>mdi-chevron-right</v-icon>
                  </v-btn>

                  <v-spacer></v-spacer>

                  <v-btn text @click="cancel">
                    Cancel
                  </v-btn>
                </div>
              </v-form>
            </v-stepper-content>

            <!-- DEPTH -->
            <v-stepper-content step="6">
              <v-form ref="depthForm" @change="resetDepth()">
                <div v-if="config.file_type === 'SERIES' && config.interval === 'DISCRETE'">
                  <Alert type="info" title="Depth Information Not Supported">
                    <p>Depth information is not supported for discrete timeseries data.</p>
                    <p class="mb-0">Please click <strong>Continue</strong> to skip this step.</p>
                  </Alert>
                </div>
                <div v-else>
                  <div v-if="config.file_type === 'SERIES' && config.interval === 'CONTINUOUS'">
                    <div class="text-h6">Depth</div>
                    <p>If the file contains multiple timeseries at one or more stations, then either:</p>

                    <ol class="mb-4">
                      <li>Specify the <strong>depth category</strong> and/or <strong>numeric depth</strong>, which will be applied to all timeseries within the file, or</li>
                      <li>Specify a <strong>column</strong> containing the depth of each timeseries.</li>
                    </ol>

                    <div class="text-subtitle-1 font-weight-bold">Category</div>
                    <p>Where in the water column were the measurements taken? (Optional)</p>
                    <v-select
                      v-model="config.depth_category"
                      :items="depth.category.options"
                      :rules="depth.category.rules"
                      item-text="label"
                      item-value="value"
                      outlined
                      clearable
                    ></v-select>

                    <div class="text-subtitle-1 font-weight-bold">Numeric</div>
                    <p>
                      What was the approximate depth (e.g. 5 meters) at which the measurements were collected? (Optional)
                    </p>
                    <v-text-field
                      v-model="config.depth_value"
                      :rules="depth.value.rules"
                      type="number"
                      hint="If depth varies, use depth at start of the timeseries."
                      persistent-hint
                      outlined
                    ></v-text-field>

                    <Alert
                      v-if="config.depth_value !== null && config.depth_value !== '' && !!config.depth_column"
                      type="warning"
                      title="Numeric Depth Will Be Ignored"
                      class="mt-4"
                    >
                      If both a numeric depth and depth column are specified, only the values in the column will be used and the numeric depth will be ignored.
                    </Alert>
                  </div>

                  <div class="text-subtitle-1 font-weight-bold">Depth Column</div>
                  <p v-if="config.file_type === 'SERIES'">
                    If file contains multiple timeseries at different depths, which column contains the depth of each timeseries? (Optional)
                  </p>
                  <p v-else-if="config.file_type === 'PROFILES'">
                    Which column contains the depth of each measurement?
                  </p>
                  <v-select
                    v-model="config.depth_column"
                    :items="fileColumns"
                    :rules="depth.column.rules"
                    outlined
                    clearable
                  ></v-select>
                  <Alert
                    v-if="config.file_type === 'SERIES' && config.interval === 'CONTINUOUS' && config.depth_column"
                    type="warning"
                    title="Time-varying Depths Not Supported"
                  >
                    <p>
                      For each station in this file, rows will be grouped by depth into separate timeseries, one for <strong>each unique depth</strong> found in this column.
                    </p>
                    <p>
                      For example, if the file contains three separate timeseries of measurements collected at 0, 5, and 10 m depths, then the depth column should contain '0' for all measurements at 0 m, '5' for all at 5 m, and '10' for all at 10 m.
                    </p>
                    <p class="mb-0">
                      A depth column is typically used when the file contains multiple stations with a different depth for each station, or when the file contains paired surface/bottom timeseries or a lake array using multiple loggers deployed at different depths but at the same location.
                    </p>
                  </Alert>

                  <div class="text-subtitle-1 font-weight-bold">Units</div>
                  <p>What are the depth units? <span v-if="config.file_type === 'SERIES'">(Required if either numeric depth or depth column is set)</span></p>
                  <v-select
                    v-model="config.depth_units"
                    :items="depth.units.options"
                    :rules="depth.units.rules"
                    item-text="label"
                    item-value="value"
                    hint="All depths will be converted to meters."
                    persistent-hint
                    outlined
                    clearable
                  ></v-select>

                  <Alert type="error" title="Depth Error" v-if="depth.status === 'ERROR'">
                    {{ depth.error || 'Unknown error' }}
                  </Alert>
                </div>

                <v-divider class="my-4"></v-divider>
                <div class="d-flex mt-4 mb-2">
                  <v-btn text class="mr-4 px-4" @click="step -= 1">
                    <v-icon left>mdi-chevron-left</v-icon> Previous
                  </v-btn>
                  <v-btn color="primary" class="mr-4 px-4" @click="nextDepth" :loading="depth.loading">
                    Continue <v-icon right>mdi-chevron-right</v-icon>
                  </v-btn>

                  <v-spacer></v-spacer>

                  <v-btn text @click="cancel">
                    Cancel
                  </v-btn>
                </div>
              </v-form>
            </v-stepper-content>

            <!-- METADATA -->
            <v-stepper-content step="7">
              <v-form ref="metaForm">
                <div>
                  <div v-if="config.file_type === 'SERIES' && config.interval === 'CONTINUOUS'">
                    <div class="text-h6">SOP Compliance</div>
                    <p>Was the sensor checked using pre/post water baths?</p>
                    <v-btn-toggle v-model="config.sop_bath" class="mb-8">
                      <v-btn :value="true">
                        <v-icon left>mdi-check</v-icon>
                        Yes
                      </v-btn>
                      <v-btn :value="false">
                        <v-icon left>mdi-close</v-icon>
                        No
                      </v-btn>
                    </v-btn-toggle>
                  </div>

                  <div class="text-h6">Sensor Accuracy</div>
                  <p>
                    What was the sensor accuracy level? (Optional)
                  </p>
                  <v-select
                    v-model="config.accuracy"
                    :items="meta.accuracy.options"
                    :rules="meta.accuracy.rules"
                    placeholder="Select sensor accuracy"
                    item-value="value"
                    item-text="label"
                    outlined
                    clearable
                  ></v-select>

                  <div class="text-h6">QAQC Review</div>
                  <p>
                    Have these data already undergone a QAQC review? (Optional)
                  </p>
                  <v-btn-toggle v-model="config.reviewed" class="mb-4">
                    <v-btn :value="true">
                      <v-icon left>mdi-check</v-icon>
                      Yes
                    </v-btn>
                    <v-btn :value="false">
                      <v-icon left>mdi-close</v-icon>
                      No
                    </v-btn>
                  </v-btn-toggle>

                  <Alert v-if="meta.reviewed === 'TRUE'" type="info" title="QAQC Review Assumptions">
                    <p>If a file has already undergone a QAQC review, then we assume either:</p>

                    <ol>
                      <li>The file contains a column of QAQC flags indicating invalid values (see 'Temperatures' step), or</li>
                      <li>If no flag column is present, then all data are assumed to be valid.</li>
                    </ol>
                  </Alert>

                  <Alert type="error" title="Metadata Error" v-if="!meta.status === 'ERROR'">
                    {{ meta.error || 'Unknown error' }}
                  </Alert>
                </div>

                <v-divider class="my-4"></v-divider>
                <div class="d-flex mt-4 mb-2">
                  <v-btn text class="mr-4 px-4" @click="step -= 1">
                    <v-icon left>mdi-chevron-left</v-icon> Previous
                  </v-btn>
                  <v-btn color="primary" class="mr-4 px-4" @click="nextMeta" :loading="meta.loading">
                    Continue <v-icon right>mdi-chevron-right</v-icon>
                  </v-btn>

                  <v-spacer></v-spacer>

                  <v-btn text @click="cancel">
                    Cancel
                  </v-btn>
                </div>
              </v-form>
            </v-stepper-content>

            <!-- UPLOAD -->
            <v-stepper-content step="8">
              <v-form ref="uploadForm">
                <div class="text-h6">Ready to Upload</div>

                <p>The file is ready to upload. Do not close this browser tab until uploading is complete.</p>

                <!-- <ul class="mt-2 body-2">
                  <li>Instructions...</li>
                </ul> -->

                <v-divider class="my-4"></v-divider>
                <div class="d-flex mt-4 mb-2">
                  <v-btn text class="mr-4 px-4" @click="step -= 1">
                    <v-icon left>mdi-chevron-left</v-icon> Previous
                  </v-btn>
                  <v-btn color="primary" class="mr-4 px-4" @click="submit" :loading="upload.status === 'PENDING'">
                    Submit <v-icon right>mdi-upload</v-icon>
                  </v-btn>

                  <v-spacer></v-spacer>

                  <v-btn text @click="cancelUpload">
                    Cancel
                  </v-btn>
                </div>

                <v-divider class="my-8" v-if="upload.status !== 'READY'"></v-divider>

                <div v-if="upload.status === 'PENDING'" ref="pending">
                  <div class="mb-4 font-weight-bold">
                    {{upload.message}}
                  </div>
                  <v-progress-linear
                    :active="true"
                    color="primary"
                    height="8"
                    :value="upload.progress"
                    class="mb-8"
                  ></v-progress-linear>

                  <Alert type="warning" title="Upload in Progress">
                    <div>
                      Please leave this browser tab open until uploading is complete.
                    </div>
                  </Alert>
                </div>
                <Alert type="error" title="Failed to Upload File" v-else-if="upload.status === 'FAILED'">
                  <div v-html="upload.error || 'Unknown error'"></div>
                </Alert>
                <Alert type="success" title="Upload Complete!" v-else-if="upload.status === 'DONE'">
                  <div>
                    The dataset has been uploaded and will now be queued for processing on the server.
                  </div>
                  <div class="mt-2">
                    Redirecting you back to the station files table in 5 seconds, or <router-link :to="{name: 'manageFiles'}">click here</router-link>.
                  </div>
                </Alert>
                <Alert type="error" title="Upload Cancelled" v-else-if="upload.status === 'CANCELLED'">
                  <div>
                    File upload has been cancelled. The file has been deleted from the server.
                  </div>
                  <div class="mt-2">
                    <router-link :to="{name: 'manageFiles'}">Click here</router-link> to go back to your existing files.
                  </div>
                </Alert>
              </v-form>
            </v-stepper-content>
          </v-stepper-items>
        </v-col>
        <v-divider vertical class="mt-6" v-if="$vuetify.breakpoint.lgAndUp"></v-divider>
        <v-col cols="12" lg="6">
          <div class="px-6 pt-6 pb-4">
            <div class="text-h6 mb-4">File Contents</div>
            <div
              v-if="file.lines.length > 0">
              <div class="secondary--text caption">Raw File Contents (first 100 lines)</div>
              <FilePreview :lines="file.lines" :skip-lines="+config.file_skip" />
            </div>
            <Alert type="warning" title="Loading File" v-else-if="file.loading">
              Loading selected file, please wait...
            </Alert>
            <Alert type="info" title="Load a File" v-else>
              Select a file to get started.
            </Alert>
          </div>
        </v-col>
      </v-row>
    </v-stepper>
    <!-- <pre>{{ config }}</pre> -->
  </v-card>
</template>

<script>
import { mapGetters } from 'vuex'
import evt from '@/events'

import { readLocalFile, splitLines } from '@/lib/utils'
import uploader from '@/lib/uploader'

import FilePreview from '@/components/FilePreview'

const {
  temperatureUnitsOptions,
  sensorAccuracyOptions,
  depthUnitsOptions,
  depthCategoryOptions,
  utcOffsetOptions
} = require('aktemp-utils/constants')

const {
  parseCsv,
  parseUtcOffset
} = require('aktemp-utils/parsers')

const {
  getTimestampString,
  parseTimestampString,
  guessDatetimeFormat,
  adjustTimestampToUtc,
  getLocalUtcOffsetTimezone
} = require('aktemp-utils/time')

const { validateFileConfig } = require('aktemp-utils/validators')
export default {
  name: 'ManageFileForm',
  components: { FilePreview },
  data () {
    return {
      step: 1,
      config: {
        file_skip: '0',
        file_type: null,
        interval: null,
        station_code: null,
        station_column: null,
        datetime_column: null,
        time_column: null,
        datetime_format: null,
        timezone: null,
        timezone_column: null,
        temperature_column: null,
        temperature_units: 'C',
        temperature_missing: null,
        flag_column: null,
        depth_category: null,
        depth_value: null,
        depth_column: null,
        depth_units: null,
        sop_bath: null,
        accuracy: null,
        reviewed: null
      },
      file: {
        error: null,
        loading: false,
        rules: [
          v => {
            if (!v) return 'File is required'
            const fileExtension = this.file.selected.name.split('.').pop().toLowerCase()
            if (fileExtension !== 'csv') {
              return 'File must be a comma-separated value (CSV) file with extension \'.csv\''
            }
            return true
          }
        ],
        selected: null,
        parsed: null,
        lines: []
      },
      type: {
        error: null
      },
      station: {
        error: null,
        loading: false,
        mode: 'STATION',
        selected: null,
        rules: [
          v => !!v ||
            this.station.mode !== 'STATION' ||
            'Station is required'
        ],
        column: {
          selected: null,
          rules: [
            v => !!v ||
              this.station.mode !== 'COLUMN' ||
              'Station column is required'
          ]
        }
      },
      timestamp: {
        error: null,
        loading: false,
        columns: {
          separate: false,
          date: {
            selected: null,
            options: [],
            rules: [
              v => !!v ||
                `${this.timestamp.columns.separate ? 'Date' : 'Datetime'} column is required`
            ]
          },
          time: {
            selected: null,
            options: [],
            rules: [
              v => !!v ||
                !this.timestamp.columns.separate ||
                this.config.file_type === 'PROFILES' ||
                'Time column is required'
            ]
          }
        },
        format: {
          unknown: false,
          isISO: false,
          date: {
            value: '',
            rules: [
              v => !!v ||
                this.timestamp.format.isISO ||
                'Date format is required'
            ]
          },
          time: {
            value: '',
            rules: [
              v => !!v ||
                this.timestamp.format.isISO ||
                this.config.file_type === 'PROFILES' ||
                'Time format is required'
            ]
          }
        },
        timezone: {
          mode: null,
          column: {
            selected: null,
            rules: [
              v => !!v ||
                this.timestamp.timezone.mode !== 'COLUMN' ||
                'UTC offset column is required'
            ]
          },
          utcOffset: {
            selected: null,
            options: utcOffsetOptions,
            rules: [
              v => !!v ||
                this.timestamp.timezone.mode !== 'FIXED' ||
                'UTC offset is required'
            ]
          },
          station: null
        }
      },
      temperature: {
        error: null,
        loading: false,
        column: {
          rules: [
            v => !!v ||
              'Temperature column is required'
          ]
        },
        units: {
          options: temperatureUnitsOptions,
          rules: [
            v => !!v ||
              'Units are required'
          ]
        },
        missing: {
          selected: [],
          options: ['N/A', '#N/A', 'NA', '-99', '-9999', '-99.99', 'missing'],
          rules: []
        },
        flagColumn: {
          rules: []
        }
      },
      depth: {
        error: null,
        loading: false,
        category: {
          options: depthCategoryOptions,
          rules: []
        },
        value: {
          rules: []
        },
        column: {
          rules: [
            () => !!this.config.depth_column ||
              this.config.file_type !== 'PROFILES' ||
              'Depth column is required'
          ]
        },
        units: {
          options: depthUnitsOptions,
          rules: [
            v => !!v ||
              (
                (this.config.depth_value === null || this.config.depth_value === '') &&
                !this.config.depth_column
              ) ||
              'Units are required'
          ]
        }
      },
      meta: {
        loading: false,
        error: null,
        accuracy: {
          options: sensorAccuracyOptions,
          rules: []
        }
      },
      upload: {
        status: 'READY',
        loading: null,
        error: null,
        message: null,
        progress: 0,
        file: null
      }
    }
  },
  computed: {
    ...mapGetters({
      organizations: 'manage/organizations',
      organization: 'manage/organization',
      stations: 'manage/stations'
    }),
    fileColumns () {
      if (!(this.file.parsed && this.file.parsed.meta && this.file.parsed.meta.fields)) return []
      return this.file.parsed.meta.fields.filter(d => !!d.trim())
    },
    firstRow () {
      if (!this.file.parsed || this.file.parsed.data.length === 0) return null
      return this.file.parsed.data[0]
    },
    timestampValue () {
      if (!this.firstRow ||
          !this.config.datetime_column ||
          (this.timestamp.columns.separate && this.config.file_type === 'SERIES' && !this.config.time_column)) {
        return null
      }
      // return '2022-01-02T12:05:00.000Z'
      const timeColumn = this.timestamp.columns.separate ? this.config.time_column : null
      return getTimestampString(this.firstRow, this.config.datetime_column, timeColumn)
    },
    timestampFormat () {
      if (!this.timestampValue) return null
      else if (this.timestamp.format.isISO) return 'ISO'
      else if (!this.timestamp.format.time.value) return this.timestamp.format.date.value
      else return [this.timestamp.format.date.value, this.timestamp.format.time.value].join(' ')
    },
    timestampParsed () {
      if (!this.timestampValue || !this.timestampFormat) return null
      try {
        const parsed = parseTimestampString(this.timestampValue, this.timestampFormat)
        return parsed.isValid ? parsed : null
      } catch (err) {
        console.log(err)
        return null
      }
    },
    timestampUtcOffset () {
      if (!this.timestampParsed || !this.timestamp.timezone.mode) return null

      if (this.timestamp.timezone.mode === 'NONE') {
        return 'UTC'
      } else if (this.timestamp.timezone.mode === 'LOCAL') {
        const tz = this.timestamp.timezone.station.timezone
        return getLocalUtcOffsetTimezone(this.timestampValue, this.timestampFormat, tz)
      } else if (this.timestamp.timezone.mode === 'FIXED') {
        if (!this.timestamp.timezone.utcOffset.selected) return null
        return this.timestamp.timezone.utcOffset.selected
      } else if (this.timestamp.timezone.mode === 'COLUMN') {
        if (!this.timestamp.timezone.column.selected) return null
        return this.parseUtcOffset(this.firstRow, this.timestamp.timezone.column.selected)
      }
      return null
    },
    timestampUtc () {
      if (!this.timestampParsed || !this.timestampUtcOffset) return null

      return adjustTimestampToUtc(this.timestampParsed, this.timestampUtcOffset)
    }
  },
  watch: {
    timestampValue () {
      this.guessTimestampFormat()
    }
  },
  methods: {
    // FILE
    resetFile () {
      this.file.error = null
      this.file.loading = false
      this.file.parsed = null
      this.file.lines = []

      // this.config.file_skip = 0
      this.config.file_type = null
      this.config.interval = null

      this.config.station_code = null
      this.config.station_column = null

      this.config.datetime_column = null
      this.config.time_column = null
      this.config.datetime_format = null
      this.config.timezone = null
      this.config.timezone_column = null

      this.config.temperature_column = null
      this.config.temperature_units = 'C'
      this.config.temperature_missing = null
      this.config.flag_column = null

      this.config.depth_category = null
      this.config.depth_value = null
      this.config.depth_column = null
      this.config.depth_units = null

      this.config.accuracy = null
      this.config.reviewed = null
      this.config.sop_bath = null

      this.station.mode = 'STATION'
      this.timestamp.columns.separate = false
      this.timestamp.timezone.mode = null
      this.timestamp.timezone.column.selected = null
      this.timestamp.timezone.utcOffset.selected = null
      this.timestamp.timezone.station = null
      this.temperature.missing.selected = []

      this.resetType()
      this.resetStation()
      this.resetTimestamp()
      this.resetTemperature()
      this.resetDepth()
      this.resetMeta()
    },
    async loadFile () {
      this.resetFile()

      if (!this.file.selected) {
        this.file.error = 'No file selected.'
        return
      }

      if (this.file.selected.size > 250 * 1024 * 1024) {
        this.file.error = `File '${this.file.selected.name}' exceeds maximum file size (250 MB). Please separate the data in this file into multiple (smaller) files and try again.`
        return
      }

      const fileExtension = this.file.selected.name.split('.').pop().toLowerCase()
      if (fileExtension !== 'csv') {
        this.file.error = 'Invalid file type, must be a comma-separated value (CSV) file with extension \'.csv\''
        return
      }

      if (!this.$refs.fileForm.validate()) {
        this.file.error = 'Fix the validation errors above.'
        return
      }

      this.file.loading = true

      try {
        const csv = await readLocalFile(this.file.selected)
        const results = parseCsv(csv, this.config.file_skip, true)
        this.$refs.fileInput.blur()
        this.file.parsed = Object.freeze(results)
        this.file.lines = Object.freeze(splitLines(csv))
        if (results.errors.length > 0) {
          const err = results.errors[0]
          if (err.code === 'TooManyFields') {
            this.file.error = `Too many values found on row ${err.row + 1}. The number of values in each row must equal the number of columns found in the header line.`
          } else if (err.code === 'TooFewFields') {
            this.file.error = `Too few values found on row ${err.row + 1}. The number of values in each row must equal the number of columns found in the header line.`
          } else {
            this.file.error = `${err.message} (row ${err.row + 1})`
          }
        } else if (results.data.length === 0) {
          this.file.error = 'File is empty'
        }
      } catch (err) {
        console.error(err)
        this.file.error = this.$errorMessage(err.message)
      } finally {
        this.file.loading = false
      }
    },
    nextFile () {
      if (!this.file.parsed || this.file.error) {
        return this.loadFile()
      }

      this.step += 1
    },

    // TYPE
    resetType () {
      this.type.error = null
    },
    validateType () {
      if (!this.config.file_type) {
        throw new Error('Dataset type is required')
      } else if (this.config.file_type === 'SERIES' && !this.config.interval) {
        throw new Error('Timeseries interval type is required')
      }
    },
    nextType () {
      this.type.error = null
      try {
        this.validateType()
        this.step += 1
      } catch (err) {
        console.log(err)
        this.type.error = err.toString()
      }
    },

    // STATION
    resetStation () {
      this.station.error = null
      if (this.$refs.stationForm) this.$refs.stationForm.resetValidation()
    },
    validateStation () {
      if (!this.station.mode ||
          !this.$refs.stationForm.validate()) {
        throw new Error('Form is incomplete or contains an error')
      }

      if (this.station.mode === 'STATION') {
        const station = this.stations.find(d => d.code === this.config.station_code)
        if (!station) throw new Error(`Unable to find station (code='${this.config.station_code}').`)
        this.timestamp.timezone.station = station
      } else if (this.station.mode === 'COLUMN') {
        if (!this.file.parsed || this.file.parsed.data.length === 0) throw new Error('Unable to find first station code. File appears to be empty.')

        // check all stationCodes exist
        const existingStationCodes = this.stations.map(d => d.code)
        this.file.parsed.data.forEach((d, i) => {
          const code = d[this.config.station_column]
          if (!existingStationCodes.includes(code)) {
            throw new Error(`File contains unknown station code ('${code}') in row ${i + 1}, column '${this.config.station_column}'.`)
          }
        })

        // get first station
        const code = this.file.parsed.data[0][this.config.station_column]
        const station = this.stations.find(d => d.code === code)
        if (!station) throw new Error(`Could not find station (code='${code}') in row 1, column '${this.config.station_column}'.`)

        this.timestamp.timezone.station = station
      } else {
        throw new Error('Station mode not found, expected single station or station column')
      }
    },
    nextStation () {
      this.station.error = null
      this.station.loading = true
      this.timestamp.timezone.station = null

      try {
        this.validateStation()
        this.step += 1
      } catch (err) {
        this.station.error = err.toString()
      } finally {
        this.station.loading = false
      }
    },

    // TIMESTAMP
    parseUtcOffset (row, column) {
      try {
        return parseUtcOffset(row, column)
      } catch (err) {
        this.timestamp.error = `Failed to parse first UTC offset ('${row[column]}') in column '${column}'.<br><br>Value must be the number of hours relative to UTC (e.g., '-8' for UTC-8/AKDT).<br><br>Only negative integers between -7 and -10 are accepted.`
      }
      return null
    },
    adjustTimestamp () {
      this.timestamp.error = null
      try {
        return adjustTimestampToUtc(this.timestampParsed, this.timestampUtcOffset)
      } catch (err) {
        console.log(err)
        this.timestamp.error = this.$errorMessage(err)
      }
    },
    guessTimestampFormat () {
      const value = this.timestampValue
      if (!value) return

      this.timestamp.format.unknown = false
      this.timestamp.format.isISO = false
      this.timestamp.format.date.value = ''
      this.timestamp.format.time.value = ''
      const format = guessDatetimeFormat(value)
      // console.log(`guessTimestampFormat('${value}') = ${format}`)
      if (format === 'ISO') {
        this.timestamp.format.isISO = true
      } else if (Array.isArray(format)) {
        this.timestamp.format.date.value = format[0]
        this.timestamp.format.time.value = format[1]
      } else {
        this.timestamp.format.unknown = true
      }
    },
    resetTimestamp () {
      this.timestamp.error = null
      this.config.datetime_format = null
      this.config.timezone = null
      this.config.timezone_column = null
      if (this.$refs.timestampForm) this.$refs.timestampForm.resetValidation()
    },
    validateTimestamps () {
      if (!this.$refs.timestampForm.validate()) {
        throw new Error('Form is incomplete or contains an error')
      }

      if (!this.timestampUtc) throw new Error('Unexpected Error: Failed to parse first timestamp')

      if (!this.file.parsed) throw new Error('Parsed file not found')

      const timeColumn = this.timestamp.columns.separate ? this.config.time_column : null
      this.file.parsed.data.forEach((d, i) => {
        try {
          const raw = getTimestampString(d, this.config.datetime_column, timeColumn)
          const parsed = parseTimestampString(raw, this.timestampFormat)
          return adjustTimestampToUtc(parsed, this.timestampUtcOffset)
        } catch (err) {
          throw new Error(`Invalid timestamp at row ${i + 1}<br><br>${err.toString()}`)
        }
      })
    },
    nextTimestamp () {
      this.timestamp.error = null
      this.timestamp.loading = true
      try {
        this.validateTimestamps()

        this.config.datetime_format = this.timestampFormat
        switch (this.timestamp.timezone.mode) {
          case 'NONE':
            this.config.timezone = 'UTC'
            break
          case 'LOCAL':
            this.config.timezone = 'LOCAL'
            break
          case 'FIXED':
            this.config.timezone = this.timestamp.timezone.utcOffset.selected
            break
          case 'COLUMN':
            this.config.timezone = 'COLUMN'
            this.config.timezone_column = this.timestamp.timezone.column.selected
            break
        }
        this.step += 1
      } catch (err) {
        this.timestamp.error = err.toString().replace('Error: ', '')
      } finally {
        this.timestamp.loading = false
      }
    },

    resetTemperature () {
      this.temperature.error = null
      this.config.temperature_missing = ''
      if (this.$refs.temperatureForm) this.$refs.temperatureForm.resetValidation()
    },
    validateTemperature () {
      if (!this.$refs.temperatureForm.validate()) {
        throw new Error('Form is incomplete or contains an error')
      }
    },
    nextTemperature () {
      this.temperature.error = null
      try {
        this.validateTemperature()
        this.config.temperature_missing = this.temperature.missing.selected.join(',')
        this.step += 1
      } catch (err) {
        this.temperature.error = err.toString()
      }
    },

    // DEPTH
    resetDepth () {
      this.depth.error = null
      if (this.$refs.depthForm) this.$refs.depthForm.resetValidation()
    },
    validateDepth () {
      if (!this.$refs.depthForm.validate()) {
        throw new Error('Form is incomplete or contains an error')
      }
    },
    nextDepth () {
      this.depth.error = null
      try {
        this.validateDepth()
        this.step += 1
      } catch (err) {
        this.depth.error = err.toString()
      }
    },

    // META
    resetMeta () {
      this.meta.error = null
      if (this.$refs.metaForm) this.$refs.metaForm.resetValidation()
    },
    validateMeta () {
      if (!this.$refs.metaForm.validate()) {
        throw new Error('Form is incomplete or contains an error')
      }
    },
    nextMeta () {
      this.meta.error = null
      try {
        this.validateMeta()
        this.step += 1
      } catch (err) {
        this.meta.error = err.toString()
      }
    },

    async submit () {
      this.upload.status = 'PENDING'
      this.upload.message = 'Starting upload...'
      this.upload.error = null
      this.upload.loading = true
      this.upload.progress = 0

      this.$nextTick(() => this.$vuetify.goTo(this.$refs.pending))

      const file = this.file.selected

      if (!file) {
        this.upload.status = 'FAILED'
        this.upload.message = 'Failed to upload file.'
        this.upload.error = 'Selected file could not be found. Return to step 2 and select a file.'
      }

      this.upload.progress = 0.25
      this.upload.message = `Validating ${file.name}...`
      let config
      try {
        config = validateFileConfig(this.config, this.fileColumns, this.stations)
      } catch (err) {
        console.error(err)
        this.upload.status = 'FAILED'
        this.upload.message = 'Failed to validate file configuration'
        this.upload.error = this.$errorMessage(err)
        return
      }

      this.upload.progress = 0.5
      this.upload.message = `Uploading ${file.name}...`
      try {
        this.upload.file = await uploader(file, config, this.organization.id)
      } catch (err) {
        console.error(err)
        this.upload.status = 'FAILED'
        this.upload.message = 'Failed to save file to database'
        this.upload.error = this.$errorMessage(err)
        return
      }

      this.upload.progress = 1
      this.upload.status = 'DONE'
      this.upload.message = 'Upload complete'

      evt.$emit('notify', `File ${this.upload.file.filename} has been uploaded`, 'success')
      this.$router.push({
        name: 'manageFile',
        params: {
          organizationId: this.upload.file.organization_id,
          fileId: this.upload.file.id
        }
      })
    },
    async deleteFile (file) {
      try {
        await this.$http.restricted.delete(`/files/${file.id}`)
      } catch (err) {
        console.log(`Failed to delete file (id=${file.id})`)
        console.error(err)
      }
    },
    cancelUpload () {
      if (this.upload.status === 'READY') {
        return this.$router.push({
          name: 'manageFiles'
        })
      } else if (this.upload.status === 'DONE') {
        return this.$router.push({
          name: 'manageFiles'
        })
      }
      this.upload.status = 'CANCELLED'

      if (this.upload.file) {
        this.deleteFile(this.upload.file)
      }
    },
    cancel () {
      this.$router.push({ name: 'manageFiles' })
    }
  }
}
</script>

<style>

</style>
