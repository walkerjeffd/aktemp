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
                  Instructions
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
                <!-- INSTRUCTIONS -->
                <v-stepper-content step="1">
                  <v-row justify="space-around">
                    <v-col cols="12" md="8" lg="6" xl="4" class="body-1">
                      <div class="text-h6">Instructions</div>
                      <p>Use this form to upload a new file of continuous or discrete stream temperature data.</p>

                      <v-row class="mt-8 mb-4 px-3">
                        <v-btn text class="mr-4 px-4" :disabled="true">
                          <v-icon left>mdi-chevron-left</v-icon> Previous
                        </v-btn>
                        <v-btn color="primary" class="mr-4 px-4" @click="step += 1">
                          Continue <v-icon right>mdi-chevron-right</v-icon>
                        </v-btn>

                        <v-spacer></v-spacer>

                        <v-btn text @click="$router.push({ name: 'manageFiles' })">
                          Cancel
                        </v-btn>
                      </v-row>
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

                        <pre v-if="debug">file: {{ file.selected || 'none' }}</pre>

                        <AlertError title="Error Loading File" v-if="file.status === 'ERROR'">
                          {{ file.error || 'Unknown error' }}
                        </AlertError>

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

                          <v-btn text @click="$router.push({ name: 'manageDatasets' })">
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
                              <v-btn value="single">
                                <v-icon left>mdi-map-marker</v-icon>
                                One Station
                              </v-btn>
                              <v-btn value="multiple">
                                <v-icon left>mdi-map-marker-multiple</v-icon>
                                Multiple Stations
                              </v-btn>
                            </v-btn-toggle>
                          </div>
                          <pre v-if="debug">mode: {{ station.mode }}</pre>
                        </div>

                        <div v-if="station.mode === 'single'">
                          <div>
                            <p>Which station does this file contain data for?</p>
                            <v-select
                              v-model="station.single.station.selected"
                              :items="station.single.station.options"
                              :rules="station.single.station.rules"
                              item-text="code"
                              item-value="id"
                              outlined
                            ></v-select>
                            <pre v-if="debug">station.id: {{ station.single.station.selected }}</pre>
                          </div>
                        </div>
                        <div v-else-if="station.mode === 'multiple'">
                          <p>Which column contains the station codes? Values must match codes <em>exactly</em> (case-sensitive).</p>
                          <v-select
                            v-model="station.multiple.column.selected"
                            :items="fileColumns"
                            :rules="station.multiple.column.rules"
                            outlined
                          ></v-select>
                          <pre v-if="debug">column: {{ station.multiple.column.selected }}</pre>
                        </div>

                        <div v-if="(station.mode === 'single' && !!station.single.station.selected) ||
                                   (station.mode === 'multiple' && !!station.multiple.column.selected)">
                          <p>Does the file contain a column with measured depths?</p>

                          <div class="text-center">
                            <v-btn-toggle v-model="station.depth.mode" @change="resetStation()">
                              <v-btn value="varying">
                                <v-icon left>mdi-check</v-icon>
                                Yes
                              </v-btn>
                              <v-btn value="fixed">
                                <v-icon left>mdi-close</v-icon>
                                No
                              </v-btn>
                            </v-btn-toggle>
                          </div>
                          <pre v-if="debug">depth.mode: {{ station.depth.mode }}</pre>
                        </div>

                        <div v-if="station.depth.mode === 'varying'">
                          <div>
                            <p>Which column contains the measured depths?</p>
                            <v-select
                              v-model="station.depth.varying.column.selected"
                              :items="fileColumns"
                              :rules="station.depth.varying.column.rules"
                              outlined
                            ></v-select>
                            <pre v-if="debug">depth.varying.column: {{ station.depth.varying.column.selected }}</pre>
                          </div>

                          <div v-if="!!station.depth.varying.column.selected">
                            <p>What are the depth units?</p>
                            <v-select
                              v-model="station.depth.varying.units.selected"
                              :items="station.depth.varying.units.options"
                              :rules="station.depth.varying.units.rules"
                              item-text="label"
                              item-value="value"
                              outlined
                            ></v-select>
                            <pre v-if="debug">depth.varying.units: {{ station.depth.varying.units.selected }}</pre>
                          </div>
                        </div>
                        <div v-else-if="station.depth.mode === 'fixed'">
                          <div>
                            <p>What kind of approximate depth is available? Assumes all measurements were collected at similar depths (or unknown).</p>

                            <div class="text-center">
                              <v-btn-toggle v-model="station.depth.fixed.mode" @change="resetStation()">
                                <v-btn value="numeric">
                                  <v-icon left>mdi-numeric</v-icon>
                                  Numeric
                                </v-btn>
                                <v-btn value="categorical">
                                  <v-icon left>mdi-format-list-bulleted-square</v-icon>
                                  Categorical
                                </v-btn>
                                <v-btn value="unknown">
                                  <v-icon left>mdi-close</v-icon>
                                  None (Unknown)
                                </v-btn>
                              </v-btn-toggle>
                            </div>
                            <pre v-if="debug">depth.fixed.mode: {{ station.depth.fixed.mode }}</pre>
                          </div>

                          <div v-if="station.depth.fixed.mode === 'numeric'">
                            <div>
                              <p>What was the approximate depth? Should represent depth at <u>start</u> of deployment.</p>

                              <v-text-field
                                v-model="station.depth.fixed.numeric.value.value"
                                :rules="station.depth.fixed.numeric.value.rules"
                                type="number"
                                outlined
                              ></v-text-field>
                              <pre v-if="debug">depth.fixed.numeric.value: {{ station.depth.fixed.numeric.value.value }}</pre>
                            </div>

                            <div>
                              <p>What are the units of this depth?</p>
                              <v-select
                                v-model="station.depth.fixed.numeric.units.selected"
                                :items="station.depth.fixed.numeric.units.options"
                                :rules="station.depth.fixed.numeric.units.rules"
                                item-text="label"
                                item-value="value"
                                outlined
                              ></v-select>
                              <pre v-if="debug">depth.fixed.numeric.units: {{ station.depth.fixed.numeric.units.selected }}</pre>
                            </div>
                          </div>
                          <div v-else-if="station.depth.fixed.mode === 'categorical'">
                            <p>What was the approximate depth?</p>
                            <v-select
                              v-model="station.depth.fixed.categorical.selected"
                              :items="station.depth.fixed.categorical.options"
                              :rules="station.depth.fixed.categorical.rules"
                              item-text="label"
                              item-value="value"
                              outlined
                            ></v-select>
                            <pre v-if="debug">depth.fixed.categorical: {{ station.depth.fixed.categorical.selected }}</pre>
                          </div>
                        </div>

                        <AlertError title="Station Error" v-if="station.status === 'ERROR'">
                          {{ station.error || 'Unknown error' }}
                        </AlertError>

                        <v-row class="mt-8 mb-4 px-3">
                          <v-btn text class="mr-4 px-4" @click="step -= 1">
                            <v-icon left>mdi-chevron-left</v-icon> Previous
                          </v-btn>
                          <v-btn color="primary" class="mr-4 px-4" @click="nextStation" :loading="station.loading">
                            Continue <v-icon right>mdi-chevron-right</v-icon>
                          </v-btn>

                          <v-spacer></v-spacer>

                          <v-btn text @click="$router.push({ name: 'manageDatasets' })">
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
                                <v-btn value="yes">
                                  <v-icon left>mdi-check</v-icon>
                                  Yes
                                </v-btn>
                                <v-btn value="no">
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
                                    timestamp.combined.includesTimezone.value === 'no'
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

                        <AlertError title="Timestamp Error" v-if="timestamp.status === 'ERROR'">
                          {{ timestamp.error || 'Unknown error' }}
                        </AlertError>

                        <v-row class="mt-8 mb-4 px-3">
                          <v-btn text class="mr-4 px-4" @click="step -= 1">
                            <v-icon left>mdi-chevron-left</v-icon> Previous
                          </v-btn>
                          <v-btn color="primary" class="mr-4 px-4" @click="nextTimestamp" :loading="timestamp.loading">
                            Continue <v-icon right>mdi-chevron-right</v-icon>
                          </v-btn>

                          <v-spacer></v-spacer>

                          <v-btn text @click="$router.push({ name: 'manageDatasets' })">
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
                          <div>
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
                        </div>

                        <div v-if="!!value.column.selected && !!value.units.selected">
                          <div>
                            <p>
                              Are there any special missing value indicators (e.g., '-99', 'N/A')?
                            </p>
                            <div class="text-center">
                              <v-btn-toggle v-model="value.missing.mode" @change="resetValue()">
                                <v-btn value="yes">
                                  <v-icon left>mdi-check</v-icon>
                                  Yes
                                </v-btn>
                                <v-btn value="no">
                                  <v-icon left>mdi-close</v-icon>
                                  No
                                </v-btn>
                              </v-btn-toggle>
                            </div>
                            <pre v-if="debug">value.missing.mode: {{ value.missing.mode }}</pre>
                          </div>
                          <div v-if="value.missing.mode === 'yes'">
                            <p>
                              What are the missing value indicators?<br>
                              <span class="text--secondary"></span>
                            </p>
                            <div class="text-center">
                              <v-combobox
                                v-model="value.missing.values"
                                :items="value.missing.options"
                                label="Select or enter missing value indicators"
                                hint="Select from the list, or type and press enter to add a custom value. Use backspace to delete."
                                multiple
                                outlined
                                dense
                                small-chips
                                clearable
                              ></v-combobox>
                            </div>
                            <pre v-if="debug">value.missing.values: {{ value.missing.values }}</pre>
                          </div>
                        </div>

                        <AlertError title="Temperature Values Error" v-if="value.status === 'ERROR'">
                          {{ value.error || 'Unknown error' }}
                        </AlertError>

                        <v-row class="mt-8 mb-4 px-3">
                          <v-btn text class="mr-4 px-4" @click="step -= 1">
                            <v-icon left>mdi-chevron-left</v-icon> Previous
                          </v-btn>
                          <v-btn color="primary" class="mr-4 px-4" @click="nextValue" :loading="value.loading">
                            Continue <v-icon right>mdi-chevron-right</v-icon>
                          </v-btn>

                          <v-spacer></v-spacer>

                          <v-btn text @click="$router.push({ name: 'manageDatasets' })">
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
                            <v-btn-toggle v-model="meta.interval.value" @change="resetMeta()">
                              <v-btn value="continuous">
                                <v-icon left>mdi-chart-line-variant</v-icon>
                                Continuous
                              </v-btn>
                              <v-btn value="discrete">
                                <v-icon left>mdi-scatter-plot</v-icon>
                                Discrete
                              </v-btn>
                            </v-btn-toggle>
                          </div>
                          <pre v-if="debug">meta.interval: {{ meta.interval.value }}</pre>
                        </div>

                        <div v-if="meta.interval.value === 'continuous'">
                          <div>
                            <p>
                              What was the approx. measurement frequency (minutes)? Assumes same frequency for all data in this file.
                            </p>
                            <v-text-field
                              v-model="meta.frequency.value"
                              :rules="meta.frequency.rules"
                              type="number"
                              hint="e.g., '60' = hourly, '15' = every 15 minutes"
                              persistent-hint
                              outlined
                            ></v-text-field>
                            <pre v-if="debug">meta.frequency: {{ meta.frequency.value }}</pre>
                          </div>

                          <div>
                            <p>Was the sensor checked using pre/post water baths?</p>
                            <div class="text-center">
                              <v-btn-toggle v-model="meta.sop.value" @change="resetMeta()">
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
                            <pre v-if="debug">meta.sop: {{ meta.sop.value }}</pre>
                          </div>
                        </div>

                        <div v-if="(meta.interval.value === 'continuous' &&
                                      !!meta.frequency.value &&
                                      !!meta.sop.value) ||
                                    meta.interval.value === 'discrete'">
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
                                <v-btn-toggle v-model="meta.qaqc.reviewed" @change="resetMeta()">
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
                              <pre v-if="debug">meta.qaqc.reviewed: {{ meta.qaqc.reviewed }}</pre>
                            </div>
                            <div v-if="meta.qaqc.reviewed === 'yes' || meta.qaqc.reviewed === 'unknown'">
                              <p>
                                Which column (if any) contain QAQC flags? Optional, leave blank of file does not contain flags.
                              </p>
                              <div class="text-center">
                                <v-select
                                  v-model="meta.qaqc.column.selected"
                                  :items="fileColumns"
                                  :rules="meta.qaqc.column.rules"
                                  outlined
                                  clearable
                                ></v-select>
                              </div>
                              <pre v-if="debug">meta.qaqc.column: {{ meta.qaqc.column.selected }}</pre>
                            </div>
                          </div>
                        </div>

                        <AlertError title="Metadata Error" v-if="meta.status === 'ERROR'">
                          {{ meta.error || 'Unknown error' }}
                        </AlertError>

                        <v-row class="mt-8 mb-4 px-3">
                          <v-btn text class="mr-4 px-4" @click="step -= 1">
                            <v-icon left>mdi-chevron-left</v-icon> Previous
                          </v-btn>
                          <v-btn color="primary" class="mr-4 px-4" @click="nextMeta" :loading="meta.loading">
                            Continue <v-icon right>mdi-chevron-right</v-icon>
                          </v-btn>

                          <v-spacer></v-spacer>

                          <v-btn text @click="$router.push({ name: 'manageDatasets' })">
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

                        <!-- <ul class="mt-2 body-2">
                          <li>Instructions...</li>
                        </ul> -->

                        <AlertError title="Upload Error" v-if="upload.status === 'ERROR'">
                          {{ upload.error || 'Unknown error' }}
                        </AlertError>

                        <v-row class="mt-8 mb-4 px-3">
                          <v-btn text class="mr-4 px-4" @click="step -= 1">
                            <v-icon left>mdi-chevron-left</v-icon> Previous
                          </v-btn>
                          <v-btn color="primary" class="mr-4 px-4" @click="submit" :loading="upload.loading">
                            Submit <v-icon right>mdi-upload</v-icon>
                          </v-btn>

                          <v-spacer></v-spacer>

                          <v-btn text @click="$router.push({ name: 'manageDatasets' })">
                            Cancel
                          </v-btn>
                        </v-row>
                      </v-form>
                    </v-col>
                  </v-row>
                </v-stepper-content>
              </v-stepper-items>
            </v-stepper>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
import Papa from 'papaparse'

import { utcOffsetOptions, temperatureUnitsOptions, sensorAccuracyOptions } from '@/lib/constants'

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

const depthUnitsOptions = [
  {
    value: 'cm',
    label: 'Centimeters (cm)'
  }, {
    value: 'm',
    label: 'Meters (m)'
  }, {
    value: 'in',
    label: 'Inches (in)'
  }, {
    value: 'ft',
    label: 'Feet (ft)'
  }
]

export default {
  name: 'ManageFileUpload',
  data () {
    return {
      degug: false,
      step: 1,
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
        mode: null,
        single: {
          station: {
            selected: null,
            options: [],
            rules: [
              v => !!v ||
                this.station.mode !== 'single' ||
                'Station is required'
            ]
          }
        },
        multiple: {
          column: {
            selected: null,
            rules: [
              v => !!v ||
                this.station.mode !== 'multiple' ||
                'Station column is required'
            ]
          }
        },
        depth: {
          mode: null,
          varying: {
            column: {
              selected: null,
              rules: [
                v => !!v ||
                  this.station.depth.mode !== 'varying' ||
                  'Depth column is required'
              ]
            },
            units: {
              selected: null,
              options: depthUnitsOptions,
              rules: [
                v => !!v ||
                  this.station.depth.mode !== 'varying' ||
                  'Depth units are required'
              ]
            }
          },
          fixed: {
            mode: null,
            numeric: {
              value: {
                value: null,
                rules: [
                  v => !!v || 'Depth is required'
                ]
              },
              units: {
                selected: null,
                options: depthUnitsOptions,
                rules: [
                  v => !!v ||
                    this.station.depth.mode !== 'fixed' ||
                    this.station.depth.fixed.mode !== 'numeric' ||
                    'Depth units are required'
                ]
              }
            },
            categorical: {
              selected: null,
              options: [
                { value: 'surface', label: 'Surface' },
                { value: 'middle', label: 'Mid-Depth' },
                { value: 'bottom', label: 'Bottom' }
              ],
              rules: [
                v => !!v ||
                  this.station.depth.mode !== 'fixed' ||
                  this.station.depth.fixed.mode !== 'categorical' ||
                  'Categorical depth is required'
              ]
            }
          }
        }
      },
      timestamp: {
        status: 'READY',
        loading: false,
        mode: null,
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
          mode: null,
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
          selected: 'degC',
          options: temperatureUnitsOptions,
          rules: [
            v => !!v ||
              'Units are required'
          ]
        },
        missing: {
          mode: 'no',
          values: [],
          options: ['N/A', '#N/A', 'NA', 'missing', '-99', '-99.99']
        }
      },
      meta: {
        status: 'READY',
        loading: false,
        interval: {
          value: null
        },
        frequency: {
          value: null,
          rules: [
            v => !!v || 'Frequency is required'
          ]
        },
        sop: {
          value: null
        },
        accuracy: {
          selected: null,
          options: sensorAccuracyOptions,
          rules: [
            v => !!v || 'Accuracy is required'
          ]
        },
        qaqc: {
          reviewed: null,
          column: {
            selected: null,
            rules: []
          }
        }
      },
      upload: {}
    }
  },
  computed: {
    fileColumns () {
      return this.file.parsed && this.file.parsed.meta ? this.file.parsed.meta.fields : []
    }
  },
  mounted () {
    this.fetchStations()
  },
  methods: {
    async fetchStations () {
      // this.loading = true
      // this.error = null

      try {
        const response = await this.$http.restricted.get('/stations')
        this.station.single.station.options = response.data
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
          !this.station.depth.mode ||
          (this.station.depth.mode === 'fixed' &&
            !this.station.depth.fixed.mode) ||
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
            !this.timestamp.combined.includesTimezone.value) ||
          (!this.timestamp.timezone.mode &&
            !(this.timestamp.mode === 'combined' &&
              this.timestamp.combined.includesTimezone.value === 'yes')
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

      if (!this.$refs.valueForm.validate() ||
          !this.value.missing.mode) {
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
          (!this.meta.interval === 'continuous' && !this.meta.sop.value) ||
          !this.meta.qaqc.reviewed ||
          !this.$refs.metaForm.validate()) {
        this.meta.status = 'ERROR'
        this.meta.error = 'Form is incomplete or contains an error'
        return
      }
      this.step += 1
    },
    submit () {
      console.log('uploading...')
    }
  }
}
</script>

<style>

</style>
