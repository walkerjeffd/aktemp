<template>
  <v-main>
    <v-container>
      <v-row justify="space-around">
        <v-col cols="12">
          <v-card elevation="4">
            <v-toolbar flat dense color="grey lighten-3">
              <v-toolbar-title v-if="!$vuetify.breakpoint.mobile">
                <span class="text-h6">Upload Data File</span>
              </v-toolbar-title>
              <v-spacer></v-spacer>
              <v-btn text @click="$router.push({ name: 'manageFiles' })">
                <v-icon left>mdi-chevron-left</v-icon> <span v-if="!$vuetify.breakpoint.mobile">Back to Files</span><span v-else>Back</span>
              </v-btn>
            </v-toolbar>

            <v-stepper v-model="step">
              <v-stepper-header>
                <v-stepper-step step="1" :complete="step > 1">
                  Organization
                </v-stepper-step>

                <v-divider></v-divider>

                <v-stepper-step step="2" :complete="step > 2">
                  File
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
                  Metadata
                </v-stepper-step>

                <v-divider></v-divider>

                <v-stepper-step step="7">
                  Finish
                </v-stepper-step>
              </v-stepper-header>

              <v-stepper-items class="body-1">
                <!-- ORGANIZATION -->
                <v-stepper-content step="1">
                  <v-row justify="space-around">
                    <v-col cols="12" md="8" lg="6" xl="4">
                      <v-form ref="organizationForm">
                        <div class="text-h6">Select Organization for File Upload</div>
                        <p>All data in this file will belong to the selected organization</p>

                        <v-select
                          v-model="organization.selected"
                          :items="organizations"
                          :rules="organization.rules"
                          item-text="name"
                          item-value="id"
                          outlined
                        ></v-select>
                        <pre v-if="debug">organization: {{ organization.selected || 'none' }}</pre>

                        <Alert type="error" title="Form Error" v-if="organization.status === 'ERROR'">
                          {{ organization.error || 'Unknown error' }}
                        </Alert>

                        <v-row class="mt-8 mb-4 px-3">
                          <v-btn text class="mr-4 px-4" :disabled="true">
                            <v-icon left>mdi-chevron-left</v-icon> Previous
                          </v-btn>
                          <v-btn color="primary" class="mr-4 px-4" @click="nextOrganization">
                            Continue <v-icon right>mdi-chevron-right</v-icon>
                          </v-btn>

                          <v-spacer></v-spacer>

                          <v-btn text @click="cancel">
                            Cancel
                          </v-btn>
                        </v-row>
                      </v-form>
                    </v-col>
                  </v-row>
                </v-stepper-content>

                <!-- FILE -->
                <v-stepper-content step="2">
                  <v-row justify="space-around">
                    <v-col cols="12" md="8" lg="6" xl="4">
                      <v-form ref="fileForm">
                        <div class="text-h6">Select Data File</div>

                        <!-- <ul class="mt-2 body-2">
                          <li>Instructions...</li>
                        </ul> -->

                        <v-file-input
                          v-model="file.selected"
                          label="Select a CSV file"
                          :rules="file.rules"
                          truncate-length="200"
                          @change="selectFile"
                          ref="fileInput"
                        >
                        </v-file-input>

                        <pre v-if="debug">file: {{ file.selected && file.selected.name || 'none' }}</pre>

                        <Alert type="error" title="Error Loading File" v-if="file.status === 'ERROR'">
                          {{ file.error || 'Unknown error' }}
                        </Alert>

                        <v-alert
                          type="success"
                          text
                          colored-border
                          border="left"
                          class="body-2 mb-0"
                          v-if="file.status === 'SUCCESS'"
                        >
                          <div class="font-weight-bold body-1">File successfuly loaded</div>
                          <div class="mt-4">
                            <table>
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
                                    {{ fileColumns.map(d => `"${d}"`).join(', ')}}
                                  </td>
                                </tr>
                                <tr>
                                  <td class="text-right pr-2"># Rows:</td>
                                  <td class="font-weight-bold">{{ file.parsed.data.length.toLocaleString() }}</td>
                                </tr>
                              </tbody>
                            </table>
                            <p class="mt-4 body-1 mb-0">
                              If this information looks correct, click <strong>Continue</strong>.
                            </p>
                          </div>
                        </v-alert>

                        <v-row class="mt-8 mb-4 px-3">
                          <v-btn text class="mr-4 px-4" @click="step -= 1">
                            <v-icon left>mdi-chevron-left</v-icon> Previous
                          </v-btn>
                          <v-btn color="primary" class="mr-4 px-4" @click="nextFile" :loading="file.loading">
                            Continue <v-icon right>mdi-chevron-right</v-icon>
                          </v-btn>

                          <v-spacer></v-spacer>

                          <v-btn text @click="cancel">
                            Cancel
                          </v-btn>
                        </v-row>
                      </v-form>
                    </v-col>
                  </v-row>
                </v-stepper-content>

                <!-- STATION -->
                <v-stepper-content step="3">
                  <v-row justify="space-around">
                    <v-col cols="12" md="8" lg="6" xl="4">
                      <v-form ref="stationForm" @input="resetStation()">
                        <div class="text-h6">Station</div>

                        <!-- <ul class="mt-2 body-2">
                          <li>Instructions...</li>
                        </ul> -->

                        <div class="my-8">
                          <p>Does this file contain data from one station or multiple stations?</p>

                          <div class="text-center">
                            <v-btn-toggle v-model="station.mode" @change="resetStation()">
                              <v-btn value="station">
                                <v-icon left>mdi-map-marker</v-icon>
                                One Station
                              </v-btn>
                              <v-btn value="column">
                                <v-icon left>mdi-map-marker-multiple</v-icon>
                                Multiple Stations
                              </v-btn>
                            </v-btn-toggle>
                          </div>
                          <pre v-if="debug">mode: {{ station.mode }}</pre>
                        </div>

                        <div v-if="station.mode === 'station'">
                          <div>
                            <p>Which station does this file contain data for?</p>
                            <v-select
                              v-model="station.station.selected"
                              :items="station.station.options"
                              :rules="station.station.rules"
                              item-text="code"
                              item-value="id"
                              outlined
                            ></v-select>
                            <pre v-if="debug">station.id: {{ station.station.selected }}</pre>
                          </div>
                        </div>
                        <div v-else-if="station.mode === 'column'">
                          <p>Which column contains the station codes? Values must match codes <em>exactly</em> (case-sensitive).</p>
                          <v-select
                            v-model="station.column.selected"
                            :items="fileColumns"
                            :rules="station.column.rules"
                            outlined
                          ></v-select>
                          <pre v-if="debug">column: {{ station.column.selected }}</pre>
                        </div>

                        <div v-if="(station.mode === 'station' && !!station.station.selected) ||
                                   (station.mode === 'column' && !!station.column.selected)">
                          <p>What kind of depth information is available?</p>

                          <div class="text-center">
                            <v-btn-toggle v-model="depth.mode" @change="resetStation()">
                              <v-btn value="column">
                                <v-icon left>mdi-chart-line-variant</v-icon>
                                Time-varying
                              </v-btn>
                              <v-btn value="value">
                                <v-icon left>mdi-numeric</v-icon>
                                Numeric
                              </v-btn><br>
                              <v-btn value="category">
                                <v-icon left>mdi-format-list-bulleted-square</v-icon>
                                Categorical
                              </v-btn>
                              <v-btn value="unknown">
                                <v-icon left>mdi-close</v-icon>
                                None
                              </v-btn>
                            </v-btn-toggle>
                          </div>
                          <pre v-if="debug">depth.mode: {{ depth.mode }}</pre>

                          <div v-if="depth.mode === 'column'">
                            <div>
                              <p>Which column contains the measured depths?</p>
                              <v-select
                                v-model="depth.column.selected"
                                :items="fileColumns"
                                :rules="depth.column.rules"
                                outlined
                              ></v-select>
                              <pre v-if="debug">depth.column: {{ depth.column.selected }}</pre>
                            </div>
                            <div>
                              <p>What are the units of these depths?</p>
                              <v-select
                                v-model="depth.units.selected"
                                :items="depth.units.options"
                                :rules="depth.units.rules"
                                item-text="label"
                                item-value="value"
                                outlined
                              ></v-select>
                              <pre v-if="debug">depth.units: {{ depth.units.selected }}</pre>
                            </div>
                          </div>
                          <div v-else-if="depth.mode === 'value'">
                            <div>
                              <p>What was the approximate depth? Should represent depth at <u>start</u> of deployment.</p>

                              <v-text-field
                                v-model="depth.value.selected"
                                :rules="depth.value.rules"
                                type="number"
                                outlined
                              ></v-text-field>
                              <pre v-if="debug">depth.value: {{ depth.value.selected }}</pre>
                            </div>

                            <div>
                              <p>What are the units of this depth?</p>
                              <v-select
                                v-model="depth.units.selected"
                                :items="depth.units.options"
                                :rules="depth.units.rules"
                                item-text="label"
                                item-value="value"
                                outlined
                              ></v-select>
                              <pre v-if="debug">depth.units: {{ depth.units.selected }}</pre>
                            </div>
                          </div>
                          <div v-else-if="depth.mode === 'category'">
                            <p>What was the approximate depth?</p>
                            <v-select
                              v-model="depth.category.selected"
                              :items="depth.category.options"
                              :rules="depth.category.rules"
                              item-text="label"
                              item-value="value"
                              outlined
                            ></v-select>
                            <pre v-if="debug">depth.category: {{ depth.category.selected }}</pre>
                          </div>
                        </div>

                        <Alert type="error" title="Station Error" v-if="station.status === 'ERROR'">
                          {{ station.error || 'Unknown error' }}
                        </Alert>

                        <v-row class="mt-8 mb-4 px-3">
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
                        </v-row>
                      </v-form>
                    </v-col>
                  </v-row>
                </v-stepper-content>

                <!-- TIMESTAMP -->
                <v-stepper-content step="4">
                  <v-row justify="space-around">
                    <v-col cols="12" md="8" lg="6" xl="4">
                      <v-form ref="timestampForm" @input="resetTimestamp()">
                        <div class="text-h6">Timestamp</div>

                        <!-- <ul class="mt-2 body-2">
                          <li>Instructions...</li>
                        </ul> -->

                        <div class="my-8">
                          <p>Are dates and times in the same column or separate columns?</p>

                          <div class="text-center">
                            <v-btn-toggle v-model="timestamp.mode" @change="resetTimestamp()">
                              <v-btn value="combined">
                                <v-icon left>mdi-format-align-justify</v-icon>
                                One Column (Datetime)
                              </v-btn>
                              <v-btn value="separate">
                                <v-icon left>mdi-format-columns</v-icon>
                                Two Columns (Date, Time)
                              </v-btn>
                            </v-btn-toggle>
                          </div>
                          <pre v-if="debug">mode: {{ timestamp.mode }}</pre>
                        </div>

                        <div v-if="timestamp.mode === 'combined'">
                          <div>
                            <p>Which column contains the timestamps (datetime)?</p>
                            <v-select
                              v-model="timestamp.combined.column.selected"
                              :items="fileColumns"
                              :rules="timestamp.combined.column.rules"
                              outlined
                            ></v-select>
                            <pre v-if="debug">combined.column: {{ timestamp.combined.column.selected }}</pre>
                          </div>
                          <div v-if="!!timestamp.combined.column.selected">
                            <p>
                              Do the timestamps contain a UTC offset?<br>
                              <span class="text--secondary">e.g. "2022-04-27T15:00:00-0700"</span>
                            </p>
                            <div class="text-center">
                              <v-btn-toggle v-model="timestamp.combined.includesTimezone.value" @change="resetTimestamp()">
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
                            <pre v-if="debug">timestamp.combined.includesTimezone: {{ timestamp.combined.includesTimezone.value }}</pre>
                          </div>
                        </div>
                        <div v-else-if="timestamp.mode === 'separate'">
                          <div>
                            <p>Which column contains the dates?</p>
                            <v-select
                              v-model="timestamp.separate.date.column.selected"
                              :items="fileColumns"
                              :rules="timestamp.separate.date.column.rules"
                              outlined
                            ></v-select>
                            <pre v-if="debug">separate.date.column: {{ timestamp.separate.date.column.selected }}</pre>
                          </div>
                          <div>
                            <p>Which column contains the times?</p>
                            <v-select
                              v-model="timestamp.separate.time.column.selected"
                              :items="fileColumns"
                              :rules="timestamp.separate.time.column.rules"
                              outlined
                            ></v-select>
                            <pre v-if="debug">separate.time.column: {{ timestamp.separate.time.column.selected }}</pre>
                          </div>
                        </div>

                        <div v-if="(
                                    timestamp.mode === 'combined' &&
                                    !!timestamp.combined.column.selected &&
                                    timestamp.combined.includesTimezone.value === false
                                   ) || (
                                    timestamp.mode === 'separate' &&
                                    !!timestamp.separate.date.column.selected &&
                                    !!timestamp.separate.time.column.selected
                                   )">
                          <div>
                            <p>Is there a column containing the UTC offset for each timestamp?</p>
                            <div class="text-center">
                              <v-btn-toggle v-model="timestamp.timezone.mode" @change="resetTimestamp()">
                                <v-btn value="column">
                                  <v-icon left>mdi-check</v-icon>
                                  Yes
                                </v-btn>
                                <v-btn value="utcOffset">
                                  <v-icon left>mdi-close</v-icon>
                                  No
                                </v-btn>
                              </v-btn-toggle>
                            </div>
                            <pre v-if="debug">timezone.mode: {{ timestamp.timezone.mode }}</pre>
                          </div>

                          <div v-if="timestamp.timezone.mode === 'column'">
                            <p>Which column contains the UTC offset? Column must contain negative integers (e.g. -9 for AKST) </p>
                            <v-select
                              v-model="timestamp.timezone.column.selected"
                              :items="fileColumns"
                              :rules="timestamp.timezone.column.rules"
                              outlined
                            ></v-select>
                            <pre v-if="debug">timezone.column: {{ timestamp.timezone.column.selected }}</pre>
                          </div>
                          <div v-else-if="timestamp.timezone.mode === 'utcOffset'">
                            <p>What is the UTC offset (timezone) of the timestamps? Assumes all timestamps have the same UTC offset.</p>
                            <v-select
                              v-model="timestamp.timezone.utcOffset.selected"
                              :items="timestamp.timezone.utcOffset.options"
                              :rules="timestamp.timezone.utcOffset.rules"
                              item-text="label"
                              item-value="value"
                              outlined
                            ></v-select>
                            <pre v-if="debug">timezone.utcOffset: {{ timestamp.timezone.utcOffset.selected }}</pre>
                          </div>
                        </div>

                        <Alert type="error" title="Timestamp Error" v-if="timestamp.status === 'ERROR'">
                          {{ timestamp.error || 'Unknown error' }}
                        </Alert>

                        <v-row class="mt-8 mb-4 px-3">
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
                        </v-row>
                      </v-form>
                    </v-col>
                  </v-row>
                </v-stepper-content>

                <!-- VALUE -->
                <v-stepper-content step="5">
                  <v-row justify="space-around">
                    <v-col cols="12" md="8" lg="6" xl="4">
                      <v-form ref="valueForm" @input="resetValue()">
                        <div class="text-h6">Temperature Values</div>

                        <!-- <ul class="mt-2 body-2">
                          <li>Instructions...</li>
                        </ul> -->

                        <div>
                          <p>Which column contains the temperature values?</p>
                          <v-select
                            v-model="value.column.selected"
                            :items="fileColumns"
                            :rules="value.column.rules"
                            outlined
                          ></v-select>
                          <pre v-if="debug">value.column: {{ value.column.selected }}</pre>
                        </div>

                        <div v-if="!!value.column.selected">
                          <p>What are the units?</p>
                          <v-select
                            v-model="value.units.selected"
                            :items="value.units.options"
                            :rules="value.units.rules"
                            item-text="label"
                            item-value="value"
                            outlined
                          ></v-select>
                          <pre v-if="debug">value.units: {{ value.units.selected }}</pre>
                        </div>

                        <div v-if="!!value.column.selected && !!value.units.selected">
                          <div>
                            <p>
                              What are the missing value indicators (e.g., 'N/A')? (Optional, leave blank if none)<br>
                              <span class="text--secondary"></span>
                            </p>
                            <div class="text-center">
                              <v-combobox
                                v-model="value.missing.selected"
                                :items="value.missing.options"
                                label="Select or enter missing value indicators"
                                hint="Select from the list, or type and press enter to add a custom value. Use backspace to delete."
                                multiple
                                outlined
                                small-chips
                                clearable
                              ></v-combobox>
                            </div>
                            <pre v-if="debug">value.missing.selected: {{ value.missing.selected }}</pre>
                          </div>
                        </div>

                        <Alert type="error" title="Temperature Values Error" v-if="value.status === 'ERROR'">
                          {{ value.error || 'Unknown error' }}
                        </Alert>

                        <v-row class="mt-8 mb-4 px-3">
                          <v-btn text class="mr-4 px-4" @click="step -= 1">
                            <v-icon left>mdi-chevron-left</v-icon> Previous
                          </v-btn>
                          <v-btn color="primary" class="mr-4 px-4" @click="nextValue" :loading="value.loading">
                            Continue <v-icon right>mdi-chevron-right</v-icon>
                          </v-btn>

                          <v-spacer></v-spacer>

                          <v-btn text @click="cancel">
                            Cancel
                          </v-btn>
                        </v-row>
                      </v-form>
                    </v-col>
                  </v-row>
                </v-stepper-content>

                <!-- METADATA -->
                <v-stepper-content step="6">
                  <v-row justify="space-around">
                    <v-col cols="12" md="8" lg="6" xl="4">
                      <v-form ref="metaForm" @input="resetMeta()">
                        <div class="text-h6">Metadata</div>

                        <!-- <ul class="mt-2 body-2">
                          <li>Instructions...</li>
                        </ul> -->

                        <div>
                          <p>Were the data collected at continuous (logger) or discrete (grab) intervals?</p>
                          <div class="text-center">
                            <v-btn-toggle v-model="meta.interval" @change="resetMeta()">
                              <v-btn value="continuous">
                                <v-icon left>mdi-chart-line-variant</v-icon>
                                Continuous
                              </v-btn>
                              <v-btn value="discrete">
                                <v-icon left>mdi-chart-bubble</v-icon>
                                Discrete
                              </v-btn>
                            </v-btn-toggle>
                          </div>
                          <pre v-if="debug">meta.interval: {{ meta.interval }}</pre>
                        </div>

                        <div v-if="meta.interval === 'continuous'">
                          <div>
                            <p>Was the sensor checked using pre/post water baths?</p>
                            <div class="text-center">
                              <v-btn-toggle v-model="meta.sop" @change="resetMeta()">
                                <v-btn value="yes">
                                  <v-icon left>mdi-check</v-icon>
                                  Yes
                                </v-btn>
                                <v-btn value="no">
                                  <v-icon left>mdi-close</v-icon>
                                  No
                                </v-btn>
                                <v-btn value="unknown">
                                  <v-icon left small>mdi-help</v-icon>
                                  Unknown
                                </v-btn>
                              </v-btn-toggle>
                            </div>
                            <pre v-if="debug">meta.sop: {{ meta.sop }}</pre>
                          </div>
                        </div>

                        <div v-if="(meta.interval === 'continuous' && !!meta.sop) || meta.interval == 'discrete'">
                          <div>
                            <p>
                              What was the sensor accuracy level?
                            </p>
                            <v-select
                              v-model="meta.accuracy.selected"
                              :items="meta.accuracy.options"
                              :rules="meta.accuracy.rules"
                              item-value="value"
                              item-text="label"
                              outlined
                            ></v-select>
                            <pre v-if="debug">meta.accuracy: {{ meta.accuracy.selected }}</pre>
                          </div>

                          <div v-if="!!meta.accuracy.selected">
                            <div>
                              <p>
                                Have these data already undergone a QAQC review?
                              </p>
                              <div class="text-center">
                                <v-btn-toggle v-model="meta.reviewed" @change="resetMeta()">
                                  <v-btn value="yes">
                                    <v-icon left>mdi-check</v-icon>
                                    Yes
                                  </v-btn>
                                  <v-btn value="no">
                                    <v-icon left>mdi-close</v-icon>
                                    No
                                  </v-btn>
                                  <v-btn value="unknown">
                                    <v-icon left small>mdi-help</v-icon>
                                    Unknown
                                  </v-btn>
                                </v-btn-toggle>
                              </div>
                              <pre v-if="debug">meta.reviewed: {{ meta.reviewed }}</pre>
                            </div>
                            <div v-if="!!meta.reviewed && meta.reviewed !== 'no'">
                              <p>
                                Which column contain QAQC flags? (Optional, leave blank if none)
                              </p>
                              <div class="text-center">
                                <v-select
                                  v-model="meta.flagColumn.selected"
                                  :items="fileColumns"
                                  :rules="meta.flagColumn.rules"
                                  outlined
                                  clearable
                                ></v-select>
                              </div>
                              <pre v-if="debug">meta.flagColumn: {{ meta.flagColumn.selected }}</pre>
                            </div>
                          </div>
                        </div>

                        <Alert type="error" title="Metadata Error" v-if="meta.status === 'ERROR'">
                          {{ meta.error || 'Unknown error' }}
                        </Alert>

                        <v-row class="mt-8 mb-4 px-3">
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
                        </v-row>
                      </v-form>
                    </v-col>
                  </v-row>
                </v-stepper-content>

                <!-- UPLOAD -->
                <v-stepper-content step="7">
                  <v-row justify="space-around">
                    <v-col cols="12" md="8" lg="6" xl="4">
                      <v-form ref="uploadForm">
                        <div class="text-h6">Ready to Upload</div>

                        <p>The file is ready to upload. Do not close this browser tab until uploading is complete.</p>

                        <!-- <ul class="mt-2 body-2">
                          <li>Instructions...</li>
                        </ul> -->

                        <v-row class="mt-8 mb-4 px-3">
                          <v-btn text class="mr-4 px-4" @click="step -= 1">
                            <v-icon left>mdi-chevron-left</v-icon> Previous
                          </v-btn>
                          <v-btn color="primary" class="mr-4 px-4" @click="submit" :loading="upload.status === 'PENDING'">
                            Submit <v-icon right>mdi-upload</v-icon>
                          </v-btn>

                          <v-spacer></v-spacer>

                          <v-btn text @click="cancel">
                            Cancel
                          </v-btn>
                        </v-row>

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
                    </v-col>
                  </v-row>
                </v-stepper-content>
              </v-stepper-items>
              <v-sheet class="ma-4 pa-4 elevation-4" v-if="debug">
                <pre>config: {{ fileConfig }}</pre>
              </v-sheet>
            </v-stepper>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
import { mapGetters } from 'vuex'
import Papa from 'papaparse'

import { utcOffsetOptions, temperatureUnitsOptions, sensorAccuracyOptions, depthUnitsOptions } from '@/lib/constants'
import evt from '@/events'

const parseFile = (file) => new Promise((resolve, reject) => {
  return Papa.parse(file, {
    header: true,
    comments: '#',
    delimiter: ',',
    download: false,
    skipEmptyLines: 'greedy',
    complete: (results) => resolve(results),
    error: (err) => reject(err)
  })
})

export default {
  name: 'ManageFileUpload',
  data () {
    return {
      debug: true,
      step: 1,
      organization: {
        status: 'READY',
        error: null,
        selected: null,
        // selected: (this.organizations.length === 1 ? this.organizations[0].id : null),
        rules: [
          v => !!v || 'Organization is required'
        ]
      },
      file: {
        status: 'READY',
        loading: false,
        rules: [
          v => {
            if (!v) return true
            const fileExtension = this.file.selected.name.split('.').pop().toLowerCase()
            if (fileExtension !== 'csv') {
              return 'File must be a comma-separated value (CSV) file with extension \'.csv\''
            }
            return true
          }
        ],
        selected: null,
        parsed: null
      },
      station: {
        status: 'READY',
        loading: false,
        mode: null, // station, column
        station: {
          selected: null,
          options: [],
          rules: [
            v => !!v ||
              this.station.mode !== 'station' ||
              'Station is required'
          ]
        },
        column: {
          selected: null,
          rules: [
            v => !!v ||
              this.station.mode !== 'column' ||
              'Station column is required'
          ]
        }
      },
      depth: {
        mode: null, // column, value, category, unknown
        column: {
          selected: null,
          rules: [
            v => !!v ||
              this.depth.mode !== 'column' ||
              'Depth column is required'
          ]
        },
        units: {
          selected: null,
          options: depthUnitsOptions,
          rules: [
            v => !!v ||
              this.depth.mode === 'category' ||
              this.depth.mode === 'unknown' ||
              'Units are required'
          ]
        },
        value: {
          selected: null,
          rules: [
            v => !!v ||
              this.depth.mode !== 'value' ||
              'Depth is required'
          ]
        },
        category: {
          selected: null,
          options: [
            { value: 'surface', label: 'Surface' },
            { value: 'middle', label: 'Mid-Depth' },
            { value: 'bottom', label: 'Bottom' }
          ],
          rules: [
            v => !!v ||
              this.depth.mode !== 'category' ||
              'Categorical depth is required'
          ]
        }
      },
      timestamp: {
        status: 'READY',
        loading: false,
        mode: null, // combined, separate
        combined: {
          column: {
            selected: null,
            rules: [
              v => !!v ||
                this.timestamp.mode !== 'combined' ||
                'Datetime column is required'
            ]
          },
          includesTimezone: {
            value: null,
            rules: [
              v => !!v ||
                this.timestamp.mode !== 'combined' ||
                'Includes timezone is required'
            ]
          }
        },
        separate: {
          date: {
            column: {
              selected: null,
              rules: [
                v => !!v ||
                  this.timestamp.mode !== 'separate' ||
                  'Date column is required'
              ]
            }
          },
          time: {
            column: {
              selected: null,
              rules: [
                v => !!v ||
                  this.timestamp.mode !== 'separate' ||
                  'Time column is required'
              ]
            }
          }
        },
        timezone: {
          mode: null, // column, utcOffset
          column: {
            selected: null,
            rules: [
              v => !!v ||
                this.timestamp.timezone.mode !== 'column' ||
                'UTC offset column is required'
            ]
          },
          utcOffset: {
            selected: null,
            options: utcOffsetOptions,
            rules: [
              v => !!v ||
                v === 0 ||
                this.timestamp.timezone.mode !== 'utcOffset' ||
                'UTC offset is required'
            ]
          }
        }
      },
      value: {
        status: 'READY',
        loading: false,
        column: {
          selected: null,
          rules: [
            v => !!v ||
              'Temperature values column is required'
          ]
        },
        units: {
          selected: 'C',
          options: temperatureUnitsOptions,
          rules: [
            v => !!v ||
              'Units are required'
          ]
        },
        missing: {
          mode: null,
          selected: [],
          options: ['N/A', '#N/A', 'NA', 'missing', '-99', '-99.99']
        }
      },
      meta: {
        status: 'READY',
        loading: false,
        interval: null,
        sop: null,
        accuracy: {
          selected: null,
          options: sensorAccuracyOptions,
          rules: []
        },
        reviewed: null,
        flagColumn: {
          selected: null,
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
      defaultOrganization: 'manage/organization'
    }),
    fileColumns () {
      return this.file.parsed && this.file.parsed.meta ? this.file.parsed.meta.fields : []
    },
    fileConfig () {
      return this.createFileConfig()
    }
  },
  watch: {
    async 'organization.selected' () {
      this.station.station.selected = null
      this.resetStation()
      await this.fetchStations()
    }
  },
  async mounted () {
    await this.$store.dispatch('manage/fetchOrganizations')
    this.organization.selected = this.defaultOrganization ? this.defaultOrganization.id : null
  },
  methods: {
    nextOrganization () {
      this.organization.error = null
      this.organization.status = 'PENDING'

      if (!this.$refs.organizationForm.validate()) {
        this.organization.status = 'ERROR'
        this.organization.error = 'Form is incomplete or contains an error'
        return
      }
      this.step += 1
    },
    async fetchStations () {
      if (!this.organization.selected) return
      // this.loading = true
      // this.error = null

      try {
        const response = await this.$http.restricted.get(`/organizations/${this.organization.selected}/stations`)
        this.station.station.options = response.data
      } catch (err) {
        alert('Failed to load stations, see console log')
        console.error(err)
        // this.error = err.toString()
      } finally {
        // this.loading = false
      }
    },
    selectFile () {
      this.file.error = null
      this.file.parsed = null

      if (!this.$refs.fileForm.validate()) {
        this.file.status = 'ERROR'
        return
      }

      if (!this.file.selected) {
        this.file.status = 'ERROR'
        this.file.error = 'No file selected.'
        return
      }

      this.file.status = 'PENDING'
      this.file.loading = true

      parseFile(this.file.selected)
        .then(results => {
          this.$refs.fileInput.blur()

          if (results.errors.length > 0) {
            this.file.status = 'ERROR'
            const errors = results.errors.map(d => {
              const row = d.row ? ` (row ${results.errors[0].row})` : ''
              return `${d.message}${row}`
            })
            if (errors.length > 5) {
              this.file.error = `${errors.slice(0, 5).join(', ')}, and ${errors.length - 5} more...`
            } else {
              this.file.error = errors.join(', ')
            }
          } else if (!results.meta.fields.every(d => d.length > 0)) {
            this.file.status = 'ERROR'
            const index = results.meta.fields.findIndex(d => d.length === 0) + 1
            this.file.error = `File contains an unnamed column (column ${index}). Please remove this column or add a header name to the file and try again.`
          } else {
            this.file.status = 'SUCCESS'
            this.file.parsed = results
          }
        })
        .catch((e) => {
          console.error(e)
          this.file.status = 'ERROR'
          this.file.error = e.message || e.toString()
        })
        .finally(() => {
          this.file.loading = false
        })
    },
    nextFile () {
      if (this.file.error) return

      if (!this.file.selected) {
        this.file.status = 'ERROR'
        this.file.error = 'No file selected'
        return
      } else if (!this.$refs.fileForm.validate()) {
        this.file.status = 'ERROR'
        this.file.error = 'Invalid file'
        return
      }

      this.step += 1
    },
    resetStation () {
      this.station.status = 'READY'
      this.station.error = null
      if (this.$refs.stationForm) this.$refs.stationForm.resetValidation()
    },
    nextStation () {
      this.station.error = null

      if (!this.station.mode ||
          !this.depth.mode ||
          !this.$refs.stationForm.validate()) {
        this.station.status = 'ERROR'
        this.station.error = 'Form is incomplete or contains an error'
        return
      }

      this.step += 1
    },
    resetTimestamp () {
      this.timestamp.status = 'READY'
      this.timestamp.error = null
      if (this.$refs.timestampForm) this.$refs.timestampForm.resetValidation()
    },
    nextTimestamp () {
      this.timestamp.error = null

      if (!this.timestamp.mode ||
          !this.$refs.timestampForm.validate() ||
          (this.timestamp.mode === 'combined' &&
            this.timestamp.combined.includesTimezone.value === null) ||
          (!this.timestamp.timezone.mode &&
            !(this.timestamp.mode === 'combined' &&
              this.timestamp.combined.includesTimezone.value === true)
          )) {
        this.timestamp.status = 'ERROR'
        this.timestamp.error = 'Form is incomplete or contains an error'
        return
      }
      this.step += 1
    },
    resetValue () {
      this.value.status = 'READY'
      this.value.error = null
      if (this.$refs.valueForm) this.$refs.valueForm.resetValidation()
    },
    nextValue () {
      this.value.error = null

      if (!this.$refs.valueForm.validate()) {
        this.value.status = 'ERROR'
        this.value.error = 'Form is incomplete or contains an error'
        return
      }
      this.step += 1
    },
    resetMeta () {
      this.meta.status = 'READY'
      this.meta.error = null
      if (this.$refs.metaForm) this.$refs.metaForm.resetValidation()
    },
    nextMeta () {
      this.meta.error = null

      if (!this.meta.interval ||
          (this.meta.interval === 'continuous' && !this.meta.sop) ||
          !this.meta.accuracy ||
          !this.meta.reviewed ||
          !this.$refs.metaForm.validate()) {
        this.meta.status = 'ERROR'
        this.meta.error = 'Form is incomplete or contains an error'
        return
      }
      this.step += 1
    },
    async submit () {
      this.upload.status = 'PENDING'
      this.upload.message = 'Starting upload...'
      this.upload.error = null
      this.upload.loading = true

      this.$nextTick(() => this.$vuetify.goTo(this.$refs.pending))

      try {
        this.upload.file = await this.createFile()
      } catch (err) {
        console.error(err)
        this.upload.status = 'FAILED'
        this.upload.message = 'Failed to save file to database'
        this.upload.error = (err.response && err.response.data.message) || err.toString()
        return
      }

      const file = this.file.selected

      if (!file) {
        this.upload.status = 'FAILED'
        this.upload.message = 'Failed to upload file.'
        this.upload.error = 'Selected file could not be found. Return to step 2 and select a file.'
      }

      this.upload.message = `Uploading ${file.name}...`
      this.upload.progress = 0.25

      try {
        await this.uploadFile(this.upload.file, file)
      } catch (err) {
        console.log(err.response || err)

        if (this.upload.status === 'CANCELLED') return

        this.upload.status = 'FAILED'
        this.upload.message = `Failed to upload file: ${file.name}.`
        this.upload.error = (err.response && err.response.data.message) || err.toString()

        this.deleteFile(this.upload.file)
        return
      }

      this.upload.progress = 0.75

      try {
        await this.processFile(this.upload.file)
      } catch (err) {
        console.log(err.response || err)

        if (this.upload.status === 'CANCELLED') return

        this.upload.status = 'FAILED'
        this.upload.error = 'Failed to start processing file. The file has been saved to the server, but will need to be manually processed. Please contact us for help, or delete it and try uploading again.<br><br>'
        this.upload.error += (err.response && err.response.data.message) || err.toString()

        this.deleteFile(this.upload.file)
        return
      }

      this.upload.progress = 1

      this.upload.status = 'DONE'
      this.upload.message = 'Upload complete'

      evt.$emit('notify', `File ${this.upload.file.filename} has been uploaded`, 'success')
      this.$store.dispatch('manage/setOrganizationById', this.upload.file.organization_id)
      this.$router.push({
        name: 'manageFile',
        params: {
          fileId: this.upload.file.id
        }
      })
    },
    createFileConfig () {
      const config = {
        station: {
          mode: this.station.mode
        },
        depth: {
          mode: this.depth.mode
        },
        timestamp: {
          timezone: {}
        },
        value: {
          column: this.value.column.selected,
          units: this.value.units.selected,
          missing: this.value.missing.selected
        },
        meta: {
          interval: this.meta.interval
        }
      }

      if (this.station.mode === 'station') {
        config.station.stationId = this.station.station.selected
      } else if (this.station.mode === 'column') {
        config.station.column = this.station.column.selected
      }

      if (this.depth.mode === 'column') {
        config.depth.column = this.depth.column.selected
        config.depth.units = this.depth.units.selected
      } else if (this.depth.mode === 'value') {
        config.depth.value = this.depth.value.selected
        config.depth.units = this.depth.units.selected
      } else if (this.depth.mode === 'category') {
        config.depth.category = this.depth.category.selected
      }

      if (this.timestamp.mode === 'combined') {
        config.timestamp.columns = [
          this.timestamp.combined.column.selected
        ]
      } else if (this.timestamp.mode === 'separate') {
        config.timestamp.columns = [
          this.timestamp.separate.date.column.selected,
          this.timestamp.separate.time.column.selected
        ]
      }

      if (this.timestamp.mode === 'combined' &&
          this.timestamp.combined.includesTimezone.value) {
        config.timestamp.timezone.mode = 'timestamp'
      } else {
        config.timestamp.timezone.mode = this.timestamp.timezone.mode
        if (this.timestamp.timezone.mode === 'column') {
          config.timestamp.timezone.column = this.timestamp.timezone.column.selected
        } else if (this.timestamp.timezone.mode === 'utcOffset') {
          config.timestamp.timezone.utcOffset = this.timestamp.timezone.utcOffset.selected
        }
      }

      if (this.meta.sop !== 'unknown') {
        config.meta.sop = this.meta.sop === 'yes'
      }
      if (this.meta.accuracy.selected !== 'unknown') {
        config.meta.accuracy = this.meta.accuracy.selected
      }
      if (this.meta.reviewed !== 'unknown') {
        config.meta.reviewed = this.meta.reviewed === 'yes'
      }
      if (this.meta.flagColumn.selected) {
        config.meta.flagColumn = this.meta.flagColumn.selected
      }

      return config
    },
    async createFile () {
      if (!this.file.selected) throw new Error('File not found')
      const organizationId = this.organization.selected
      const filename = this.file.selected.name
      const config = this.createFileConfig()

      const response = await this.$http.restricted.post(`/organizations/${organizationId}/files`, {
        filename,
        config
      })

      return response.data
    },
    async updateFile (file, payload) {
      return await this.$http.restricted.put(
        `/files/${file.id}`,
        payload
      )
    },
    async processFile (file) {
      return await this.$http.restricted.post(
        `/files/${file.id}/process`,
        null
      )
    },
    async deleteFile (file) {
      try {
        await this.$http.restricted.delete(`/files/${file.id}`)
      } catch (err) {
        console.log(`Failed to delete dataset (id=${file.id})`)
        console.error(err)
      }
    },
    async uploadFile (file) {
      await this.updateFile(file, { status: 'UPLOADING' })

      const formData = new FormData()
      Object.keys(file.presignedUrl.fields).forEach((key) => {
        formData.append(key, file.presignedUrl.fields[key])
      })
      formData.append('file', this.file.selected)

      const response = await this.$http.external.post(file.presignedUrl.url, formData)

      const payload = {
        url: `https://${file.s3.Bucket}.s3.amazonaws.com/${file.s3.Key}`,
        s3: response.data.s3
      }

      await this.updateFile(file, payload)
    },
    cancelUpload () {
      if (this.upload.status === 'READY') {
        return this.$router.push({
          name: 'manageFiles'
        })
      } else if (this.upload.status === 'DONE') {
        return this.$router.push({
          name: 'manageFiles'
          // params: {
          //   datasetId: this.upload.dataset.id
          // }
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
