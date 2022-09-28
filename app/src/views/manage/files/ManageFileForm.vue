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
                          return-object
                        ></v-select>

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
                        <div>
                          <div class="text-h6 mb-4">Select Data File</div>
                          <p>Select the data file, which must be in comma-separate values (CSV) format. Then specify the number of lines above the header row containing the column names, and click <code>Load File</code>.</p>
                          <v-file-input
                            ref="fileInput"
                            v-model="file.selected"
                            label="Select CSV File"
                            :rules="file.rules"
                            truncate-length="200"
                            @change="resetFile"
                            class="mb-4"
                          >
                          </v-file-input>

                          <v-text-field
                            v-model="file.skipLines"
                            label="# Lines to Skip"
                            type="number"
                            hint="Enter # of extra lines above header row (if any). Do not skip the header line with column names."
                            persistent-hint
                            outlined
                          ></v-text-field>

                          <v-btn
                            color="primary"
                            class="mt-4"
                            :loading="file.loading"
                            @click="loadFile"
                          >
                            Load File
                          </v-btn>
                        </div>

                        <Alert v-if="file.status === 'ERROR'" type="error" title="Failed to Parse File" class="mt-4">
                          <div v-html="file.error || 'Unknown error'"></div>
                        </Alert>

                        <Alert
                          v-if="file.status === 'SUCCESS'"
                          title="File Loaded Successfully"
                          type="success"
                          class="body-2 my-4"
                        >
                          <p class="body-1">
                            Please verify this information looks correct before continuing.
                          </p>
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
                        </Alert>

                        <div class="mt-4" v-if="file.status === 'SUCCESS'">
                          <v-divider class="my-4"></v-divider>
                          <div class="text-h6">File Type</div>
                          <p>What kind of data does this file contain?</p>
                          <v-btn-toggle v-model="file.type">
                            <v-btn value="SERIES_CONTINUOUS">
                              <v-icon left>mdi-chart-line-variant</v-icon>
                              Continuous
                            </v-btn>
                            <v-btn value="SERIES_DISCRETE">
                              <v-icon left>mdi-chart-bubble</v-icon>
                              Discrete
                            </v-btn>
                            <v-btn value="PROFILES">
                              <v-icon left>mdi-arrow-expand-down</v-icon>
                              Profiles
                            </v-btn>
                          </v-btn-toggle>

                          <Alert v-if="file.type" type="info" class="mt-4 body-1">
                            <div v-if="file.type === 'SERIES_CONTINUOUS'">
                              <strong>Continuous temperature</strong> data are collected at regular time steps (e.g., every 15 minutes) at a fixed point in space, typically by a data logger.
                            </div>
                            <div v-else-if="file.type === 'SERIES_DISCRETE'">
                              <strong>Discrete temperature</strong> data are collected at irregular or semi-regular time steps (e.g., weekly), typically using a hand-held probe.
                            </div>
                            <div v-else-if="file.type === 'PROFILES'">
                              <strong>Vertical profiles</strong> are collected at a single point in time over multiple depths in lakes or other deep waterbodies, typically using a hand-help probe. The file must contain a column with the depth of each measurement.
                            </div>
                            <div v-else>
                              Unknown data type ({{ file.type }}).
                            </div>
                          </Alert>
                        </div>

                        <v-row class="mt-12 mb-4 px-3">
                          <v-btn text class="mr-4 px-4" @click="step -= 1">
                            <v-icon left>mdi-chevron-left</v-icon> Previous
                          </v-btn>
                          <v-btn
                            color="primary"
                            class="mr-4 px-4"
                            @click="nextFile"
                            :disabled="!(file.status === 'SUCCESS' && file.type)"
                          >
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
                            <v-select
                              v-model="station.station.selected"
                              :items="station.station.options"
                              :rules="station.station.rules"
                              item-text="code"
                              item-value="id"
                              outlined
                              return-object
                            ></v-select>
                          </div>
                        </div>
                        <div v-else-if="station.mode === 'COLUMN'">
                          <p>Which column contains the station codes? Values must match codes <em>exactly</em> (case-sensitive).</p>
                          <v-select
                            v-model="station.column.selected"
                            :items="fileColumns"
                            :rules="station.column.rules"
                            outlined
                          ></v-select>
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

                        <div class="mb-8">
                          <p>Are dates and times in the same column or separate columns?</p>

                          <v-btn-toggle v-model="timestamp.mode" @change="resetTimestamp()">
                            <v-btn value="COMBINED">
                              <v-icon left>mdi-format-align-justify</v-icon>
                              One Column (Datetime)
                            </v-btn>
                            <v-btn value="SEPARATE">
                              <v-icon left>mdi-format-columns</v-icon>
                              Two Columns (Date, Time)
                            </v-btn>
                          </v-btn-toggle>
                        </div>

                        <div v-if="timestamp.mode === 'COMBINED'">
                          <div>
                            <p>Which column contains the timestamps (datetime)?</p>
                            <v-select
                              v-model="timestamp.combined.column.selected"
                              :items="fileColumns"
                              :rules="timestamp.combined.column.rules"
                              outlined
                              @input="resetTimestamp()"
                            ></v-select>
                          </div>
                        </div>
                        <div v-else-if="timestamp.mode === 'SEPARATE'">
                          <div>
                            <p>Which column contains the dates?</p>
                            <v-select
                              v-model="timestamp.separate.date.column.selected"
                              :items="fileColumns"
                              :rules="timestamp.separate.date.column.rules"
                              outlined
                              @input="resetTimestamp()"
                            ></v-select>
                          </div>
                          <div>
                            <p>Which column contains the times?</p>
                            <v-select
                              v-model="timestamp.separate.time.column.selected"
                              :items="fileColumns"
                              :rules="timestamp.separate.time.column.rules"
                              outlined
                              @input="resetTimestamp()"
                            ></v-select>
                          </div>
                        </div>

                        <div v-if="firstTimestamp">
                          <p>
                            How should the timestamps be converted to UTC (aka GMT)? (please select one)
                          </p>
                          <v-radio-group v-model="timestamp.timezone.mode" @change="updateExampleTimestamp()">
                            <v-radio
                              value="GUESS"
                              label="UTC offset is not known (guess)"
                            >
                            </v-radio>
                            <v-radio
                              value="UTCOFFSET"
                              label="Specify UTC offset of all timestamps (select below)"
                            >
                            </v-radio>
                            <v-radio
                              value="TIMESTAMP"
                              label="Extract UTC offset from timestamp"
                            >
                            </v-radio>
                            <v-radio
                              value="COLUMN"
                              label="Specify column containing UTC offset of each row (select below)"
                            >
                            </v-radio>
                          </v-radio-group>

                          <div v-if="timestamp.timezone.mode === 'GUESS'">
                            <Alert :type="timestamp.timezone.example.error ? 'error' : 'success'" class="mt-4" title="Unknown UTC Offset">
                              <p>
                                When the exact UTC offset (e.g., AKST vs AKDT) is not known, then we assume the UTC offset for all timestamps is based on the timezone of the station (e.g., US/Alaska) and whether the first timestamp occurred during standard or daylight savings time.
                              </p>
                              <p>
                                For example, if station timezone is US/Alaska and first timestamp in the file occurred in winter, then we assume all timestamps are in Alaska Standard Time (AKST) with UTC offset of -9 hours. If that timestamp occurred in summer, then all timestamps would be in Alaska Daylight Time (AKDT) with UTC offset of -8 hours.
                              </p>
                              <div v-if="timestamp.timezone.example.error">
                                <strong>Failed to parse first timestamp ('{{ firstTimestamp }}').</strong><br>
                                {{ timestamp.timezone.example.error }}
                              </div>
                              <div v-else-if="timestamp.timezone.example.parsed">
                                <p>Verify that the first timestamp of the file was correctly parsed:</p>
                                <div class="ml-8">
                                  <div>
                                    Station Timezone: <strong>{{ timestamp.timezone.example.tz }} ({{ timestamp.timezone.example.station.code }})</strong>
                                  </div>
                                  <div>
                                    Raw Timestamp: <strong>'{{ timestamp.timezone.example.raw }}'</strong>
                                  </div>
                                  <div>
                                    Assumed UTC Offset: <strong>{{ timestamp.timezone.example.utcOffset }} hours ({{ timestamp.timezone.example.parsed.tz(timestamp.timezone.example.tz).format('z') }})</strong>
                                  </div>
                                  <div>
                                    Parsed Timestamp (as UTC): <strong>{{ timestamp.timezone.example.parsed.toISOString() }}</strong>
                                  </div>
                                  <div>
                                    Parsed Timestamp (as Local Time): <strong>{{ timestamp.timezone.example.parsed.tz(timestamp.timezone.example.tz).format('lll z') }}</strong>
                                  </div>
                                </div>
                              </div>
                            </Alert>
                          </div>
                          <div v-else-if="timestamp.timezone.mode === 'UTCOFFSET'">
                            <Alert :type="timestamp.timezone.example.error ? 'error' : 'success'" class="mt-4" title="Constant UTC Offset">
                              <p>
                                All timestamps are assumed to have the same UTC offset as selected below and should not automatically adjust for daylight savings time.
                              </p>
                              <p>
                                The UTC offset is usually based on when the logger or probe clock was last synchronized with the computer. For example, if the logger was last synced during winter prior to deployment, then the timestamps are most likely in standard local time (e.g., AKST with UTC offset of -9 hours)
                              </p>

                              <v-select
                                v-model="timestamp.timezone.utcOffset.selected"
                                :items="timestamp.timezone.utcOffset.options"
                                :rules="timestamp.timezone.utcOffset.rules"
                                label="Select UTC Offset"
                                item-text="label"
                                item-value="value"
                                outlined
                                return-object
                                clearable
                                @change="updateExampleTimestamp"
                              ></v-select>

                              <div v-if="timestamp.timezone.example.error">
                                <strong>Failed to parse first timestamp ('{{ firstTimestamp }}').</strong><br>
                                {{ timestamp.timezone.example.error }}
                              </div>
                              <div v-else-if="timestamp.timezone.example.parsed">
                                <p>Verify that the first timestamp of the file was correctly parsed:</p>
                                <div class="ml-8">
                                  <div>
                                    Station Timezone: <strong>{{ timestamp.timezone.example.tz }} ({{ timestamp.timezone.example.station.code }})</strong>
                                  </div>
                                  <div>
                                    Raw Timestamp: <strong>'{{ timestamp.timezone.example.raw }}'</strong>
                                  </div>
                                  <div>
                                    Selected UTC Offset: <strong>{{ timestamp.timezone.example.utcOffset }} hours ({{ timestamp.timezone.example.parsed.tz(timestamp.timezone.example.tz).format('z') }})</strong>
                                  </div>
                                  <div>
                                    Parsed Timestamp (as UTC): <strong>{{ timestamp.timezone.example.parsed.toISOString() }}</strong>
                                  </div>
                                  <div>
                                    Parsed Timestamp (as Local Time): <strong>{{ timestamp.timezone.example.parsed.tz(timestamp.timezone.example.tz).format('lll z') }}</strong>
                                  </div>
                                </div>
                              </div>
                            </Alert>
                          </div>
                          <div v-else-if="timestamp.timezone.mode === 'TIMESTAMP'">
                            <Alert :type="timestamp.timezone.example.error ? 'error' : 'success'" class="mt-4" title="Timestamp Contains UTC Offset">
                              <p>
                                Each timestamp should contain the UTC offset in <a href="https://en.wikipedia.org/wiki/ISO_8601#Time_offsets_from_UTC" target="_blank">ISO-8601 format</a> (i.e., ends in '-HHMM').
                              </p>
                              <p>
                                For example, a timestamp in Alaska Daylight Time (UTC-8) should be written as: '2020-07-01 12:00:00<strong>-0800</strong>'.
                              </p>
                              <p>
                                Because each timestamp specifies its UTC offset, the timestamps may adjust for daylight savings time.
                              </p>

                              <div v-if="timestamp.timezone.example.error">
                                <strong>Failed to parse first timestamp ('{{ firstTimestamp }}').</strong><br>
                                {{ timestamp.timezone.example.error }}
                              </div>
                              <div v-else-if="timestamp.timezone.example.parsed">
                                <p>Verify that the first timestamp of the file was correctly parsed:</p>
                                <div class="ml-8">
                                  <div>
                                    Station Timezone: <strong>{{ timestamp.timezone.example.tz }} ({{ timestamp.timezone.example.station.code }})</strong>
                                  </div>
                                  <div>
                                    Raw Timestamp: <strong>'{{ timestamp.timezone.example.raw }}'</strong>
                                  </div>
                                  <div>
                                    Parsed Timestamp (as UTC): <strong>{{ timestamp.timezone.example.parsed.toISOString() }}</strong>
                                  </div>
                                  <div>
                                    Parsed Timestamp (as Local Time): <strong>{{ timestamp.timezone.example.parsed.tz(timestamp.timezone.example.tz).format('lll z') }}</strong>
                                  </div>
                                </div>
                              </div>
                              <div v-else>
                                <strong>Error</strong>: Failed to parse timestamp ('${firstTimestamp}').
                              </div>
                            </Alert>
                          </div>
                          <div v-else-if="timestamp.timezone.mode === 'COLUMN'">
                            <Alert :type="timestamp.timezone.example.error ? 'error' : 'success'" class="mt-4" title="Columns Contains UTC Offset">
                              <p>
                                The UTC offset of each timestamp is specified in the column selected below. This column should contain the offset in hours relative to UTC.
                              </p>
                              <p>
                                For example, if the first timestamp is in Alaska Daylight Time (AKDT), which has an offset of -9 hours, then the first value in the UTC offset column should be '-9'.
                              </p>

                              <v-select
                                v-model="timestamp.timezone.column.selected"
                                :items="fileColumns"
                                :rules="timestamp.timezone.column.rules"
                                label="Select UTC Offset Column"
                                outlined
                                clearable
                                @change="updateExampleTimestamp"
                              ></v-select>

                              <div v-if="timestamp.timezone.example.error">
                                <strong>Failed to parse first timestamp ('{{ firstTimestamp }}').</strong><br>
                                {{ timestamp.timezone.example.error }}
                              </div>
                              <div v-else-if="timestamp.timezone.example.parsed">
                                <p>Verify that the first timestamp of the file was correctly parsed:</p>
                                <div class="ml-8">
                                  <div>
                                    Station Timezone: <strong>{{ timestamp.timezone.example.tz }} ({{ timestamp.timezone.example.station.code }})</strong>
                                  </div>
                                  <div>
                                    Raw Timestamp: <strong>'{{ timestamp.timezone.example.raw }}'</strong>
                                  </div>
                                  <div>
                                    UTC Offset: <strong>{{ timestamp.timezone.example.utcOffset }} hours ({{ timestamp.timezone.example.parsed.tz(timestamp.timezone.example.tz).format('z') }})</strong>
                                  </div>
                                  <div>
                                    Parsed Timestamp (as UTC): <strong>{{ timestamp.timezone.example.parsed.toISOString() }}</strong>
                                  </div>
                                  <div>
                                    Parsed Timestamp (as Local Time): <strong>{{ timestamp.timezone.example.parsed.tz(timestamp.timezone.example.tz).format('lll z') }}</strong>
                                  </div>
                                </div>
                              </div>
                            </Alert>
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
                        </div>

                        <div v-if="!!value.column.selected && !!value.units.selected">
                          <div>
                            <p>
                              What are the missing value indicators (e.g., 'N/A')? (Optional, leave blank if none)<br>
                              <span class="text--secondary"></span>
                            </p>
                            <v-combobox
                              v-model="value.missing.selected"
                              :items="value.missing.options"
                              label="Select or enter missing value indicators"
                              hint="Select from the list, or type and press enter to add a custom value. Use backspace to delete."
                              persistent-hint
                              multiple
                              outlined
                              small-chips
                              deletable-chips
                              clearable
                            ></v-combobox>
                          </div>

                          <div>
                            <p>
                              Which column (if any) contain QAQC flags? (Optional)
                            </p>
                            <div class="text-center">
                              <v-select
                                v-model="value.flagColumn.selected"
                                :items="fileColumns"
                                :rules="value.flagColumn.rules"
                                outlined
                                clearable
                              ></v-select>
                            </div>
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

                <!-- DEPTH -->
                <v-stepper-content step="6">
                  <v-row justify="space-around">
                    <v-col cols="12" md="8" lg="6" xl="4">
                      <v-form ref="depthForm" @input="resetDepth()">
                        <div class="text-h6">Depth</div>

                        <div v-if="file.type !== 'PROFILES'">
                          <p>Where in the water column were these measurements taken?</p>
                          <v-btn-toggle v-model="depth.category.selected" class="mb-4">
                            <v-btn value="SURFACE">
                              <v-icon left>mdi-arrow-collapse-up</v-icon>
                              Surface
                            </v-btn>
                            <v-btn value="MID-DEPTH">
                              <v-icon left>mdi-arrow-expand-horizontal</v-icon>
                              Mid-Depth
                            </v-btn>
                            <v-btn value="BOTTOM">
                              <v-icon left>mdi-arrow-collapse-down</v-icon>
                              Bottom
                            </v-btn>
                          </v-btn-toggle>

                          <p>What was the numeric depth (approx., if known)?</p>
                          <v-text-field
                            v-model="depth.value.selected"
                            :rules="depth.value.rules"
                            type="number"
                            hint="If depth varies, use depth at start of the deployment."
                            persistent-hint
                            outlined
                          ></v-text-field>

                          <p>
                            Which file column contains time-varying depths (if any)?
                          </p>
                          <v-select
                            v-model="depth.column.selected"
                            :items="fileColumns"
                            :rules="depth.column.rules"
                            outlined
                            clearable
                          ></v-select>
                        </div>
                        <div v-else>
                          <p>
                            Which column contains the depth of each measurement?
                          </p>
                          <v-select
                            v-model="depth.column.selected"
                            :items="fileColumns"
                            :rules="depth.column.rules"
                            outlined
                            clearable
                          ></v-select>
                        </div>

                        <p>What are the depth units (applies to both numeric depth and depth column)?</p>
                        <v-select
                          v-model="depth.units.selected"
                          :items="depth.units.options"
                          :rules="depth.units.rules"
                          item-text="label"
                          item-value="value"
                          outlined
                          clearable
                        ></v-select>

                        <Alert type="error" title="Depth Error" v-if="depth.status === 'ERROR'">
                          {{ depth.error || 'Unknown error' }}
                        </Alert>

                        <v-row class="mt-8 mb-4 px-3">
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
                        </v-row>
                      </v-form>
                    </v-col>
                  </v-row>
                </v-stepper-content>

                <!-- METADATA -->
                <v-stepper-content step="7">
                  <v-row justify="space-around">
                    <v-col cols="12" md="8" lg="6" xl="4">
                      <v-form ref="metaForm">
                        <div class="text-h6">Metadata</div>

                        <div v-if="file.type === 'SERIES_CONTINUOUS'">
                          <p>Was the sensor checked using pre/post water baths?</p>
                          <v-btn-toggle v-model="meta.sop_bath" class="mb-8">
                            <v-btn value="TRUE">
                              <v-icon left>mdi-check</v-icon>
                              Yes
                            </v-btn>
                            <v-btn value="FALSE">
                              <v-icon left>mdi-close</v-icon>
                              No
                            </v-btn>
                          </v-btn-toggle>
                        </div>

                        <p>
                          What was the sensor accuracy level?
                        </p>
                        <v-select
                          v-model="meta.accuracy.selected"
                          :items="meta.accuracy.options"
                          :rules="meta.accuracy.rules"
                          label="Select sensor accuracy"
                          item-value="value"
                          item-text="label"
                          outlined
                          clearable
                        ></v-select>

                        <p>
                          Have these data already undergone a QAQC review?
                        </p>
                        <v-btn-toggle v-model="meta.reviewed" class="mb-4">
                          <v-btn value="TRUE">
                            <v-icon left>mdi-check</v-icon>
                            Yes
                          </v-btn>
                          <v-btn value="FALSE">
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
                <v-stepper-content step="8">
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
            </v-stepper>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </v-main>
</template>

<script>
import { mapGetters } from 'vuex'

import { utcOffsetOptions, temperatureUnitsOptions, sensorAccuracyOptions, depthUnitsOptions, depthCategoryOptions } from '@/lib/constants'
import evt from '@/events'
import { parseBooleanOption, parseCsvFile, guessUtcOffset, parseTimestamp } from '@/lib/utils'

export default {
  name: 'ManageFileForm',
  data () {
    return {
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
            if (!v) return 'File is required'
            const fileExtension = this.file.selected.name.split('.').pop().toLowerCase()
            if (fileExtension !== 'csv') {
              return 'File must be a comma-separated value (CSV) file with extension \'.csv\''
            }
            return true
          }
        ],
        type: null,
        selected: null,
        skipLines: 0,
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
              this.station.mode !== 'STATION' ||
              'Station is required'
          ]
        },
        column: {
          selected: null,
          rules: [
            v => !!v ||
              this.station.mode !== 'COLUMN' ||
              'Station column is required'
          ]
        }
      },
      depth: {
        status: 'READY',
        loading: false,
        category: {
          selected: null,
          options: depthCategoryOptions,
          rules: []
        },
        value: {
          selected: null,
          rules: []
        },
        column: {
          selected: null,
          rules: [
            () => this.file.type !== 'PROFILES' ||
              'Depth column is required'
          ]
        },
        units: {
          selected: null,
          options: depthUnitsOptions,
          rules: [
            v => (
              (this.depth.value.selected === null || this.depth.value.selected === '') &&
              !this.depth.column.selected
            ) || !!v || 'Units are required'
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
                this.timestamp.mode !== 'COMBINED' ||
                'Datetime column is required'
            ]
          }
        },
        separate: {
          date: {
            column: {
              selected: null,
              rules: [
                v => !!v ||
                  this.timestamp.mode !== 'SEPARATE' ||
                  'Date column is required'
              ]
            }
          },
          time: {
            column: {
              selected: null,
              rules: [
                v => !!v ||
                  this.timestamp.mode !== 'SEPARATE' ||
                  'Time column is required'
              ]
            }
          }
        },
        timezone: {
          mode: null, // COLUMN, UTCOFFSET, TIMESTAMP, GUESS
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
                this.timestamp.timezone.mode !== 'UTCOFFSET' ||
                'UTC offset is required'
            ]
          },
          example: {
            station: null
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
          options: ['N/A', '#N/A', 'NA', '-99', '-9999', '-99.99', 'missing']
        },
        flagColumn: {
          selected: null,
          rules: []
        }
      },
      meta: {
        status: 'READY',
        loading: false,
        sop_bath: null,
        accuracy: {
          selected: null,
          options: sensorAccuracyOptions,
          rules: []
        },
        reviewed: null
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
    },
    firstTimestamp () {
      if (!this.file.parsed || this.file.parsed.data.length === 0 || !this.timestamp.mode) return null
      const row = this.file.parsed.data[0]
      if (this.timestamp.mode === 'COMBINED') {
        if (!this.timestamp.combined.column.selected) return null
        return row[this.timestamp.combined.column.selected]
      } else if (this.timestamp.mode === 'SEPARATE') {
        if (!this.timestamp.separate.date.column.selected || !this.timestamp.separate.time.column.selected) return null
        return `${row[this.timestamp.separate.date.column.selected]} ${row[this.timestamp.separate.time.column.selected]}`
      }
      return null
    }
  },
  watch: {
    async 'organization.selected' () {
      this.station.station.selected = null
      this.resetStation()
      await this.fetchStations()
    },
    defaultOrganization () {
      this.setDefaultOrganization()
    }
  },
  async mounted () {
    this.setDefaultOrganization()
  },
  methods: {
    setDefaultOrganization () {
      this.organization.selected = this.defaultOrganization || null
    },
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
        const response = await this.$http.restricted.get(`/organizations/${this.organization.selected.id}/stations`)
        this.station.station.options = response.data
      } catch (err) {
        alert('Failed to load stations, see console log')
        console.error(err)
      } finally {
        // this.loading = false
      }
    },
    resetFile () {
      this.file.status = 'READY'
      this.file.error = null
      this.file.parsed = null
    },
    loadFile () {
      this.file.error = null
      this.file.parsed = null

      if (!this.$refs.fileForm.validate()) {
        this.file.status = 'ERROR'
        this.file.error = 'Fix the validation errors above.'
        return
      }

      if (!this.file.selected) {
        this.file.status = 'ERROR'
        this.file.error = 'No file selected.'
        return
      }

      this.file.status = 'PENDING'
      this.file.loading = true

      parseCsvFile(this.file.selected, this.file.skipLines)
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
            this.file.error = `File is missing column name at index ${index}. Found the following column names:<br><br><pre class='ml-4'>${results.meta.fields.map((d, i) => `Col ${i + 1}: '${d}'`).join('<br>')}</pre><br>Please remove the unnamed column or add a header name to the file and try again.`
          } else {
            this.file.status = 'SUCCESS'
            this.file.parsed = results
          }
        })
        .catch((e) => {
          console.error(e)
          this.file.status = 'ERROR'
          this.file.error = this.$errorMessage(e.message)
        })
        .finally(() => {
          this.file.loading = false
        })
    },
    nextFile () {
      if (this.file.error) return

      if (!this.file.type) {
        this.file.status = 'ERROR'
        this.file.error = 'File type not selected'
        return
      } else if (!this.file.selected) {
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
    async nextStation () {
      this.station.error = null
      this.timestamp.timezone.example.station = null

      if (!this.station.mode ||
          !this.$refs.stationForm.validate()) {
        this.station.status = 'ERROR'
        this.station.error = 'Form is incomplete or contains an error'
        return
      }

      if (this.station.mode === 'STATION') {
        this.timestamp.timezone.example.station = this.station.station.selected
      } else if (this.station.mode === 'COLUMN') {
        if (!this.file.parsed || this.file.parsed.data.length === 0) {
          this.station.status = 'ERROR'
          this.station.error = 'Unable to get timezone of first row. File appears to be empty.'
          return
        }

        // check all stationCodes exist
        const existingStationCodes = this.station.station.options.map(d => d.code)
        const fileStationCodes = new Set(this.file.parsed.data.map(d => d[this.station.column.selected]))
        for (const x of fileStationCodes) {
          if (!existingStationCodes.includes(x)) {
            this.station.status = 'ERROR'
            this.station.error = `File contains unknown station code ${JSON.stringify(x)} in column ${JSON.stringify(this.station.column.selected)}.`
            return
          }
        }

        // get first station
        const firstStationCode = this.file.parsed.data[0][this.station.column.selected]
        const station = this.station.station.options.find(d => d.code === firstStationCode)
        if (!station) {
          this.station.status = 'ERROR'
          this.station.error = `Could not find station with code (${JSON.stringify(firstStationCode)}) extracted from the first row of the file (column: '${this.station.column.selected}').`
          return
        }
        this.timestamp.timezone.example.station = station
      } else {
        this.timestamp.timezone.example.station = null
        this.station.status = 'ERROR'
        this.station.error = 'Failed to find timezone of first row in file.'
        return
      }

      this.step += 1
    },
    resetDepth () {
      this.depth.status = 'READY'
      this.depth.error = null
      if (this.$refs.depthForm) this.$refs.depthForm.resetValidation()
    },
    nextDepth () {
      this.depth.error = null

      if (!this.$refs.depthForm.validate()) {
        this.depth.status = 'ERROR'
        this.depth.error = 'Form is incomplete or contains an error'
        return
      }

      this.step += 1
    },
    resetTimestamp () {
      this.timestamp.status = 'READY'
      this.timestamp.error = null
      if (this.$refs.timestampForm) this.$refs.timestampForm.resetValidation()
      this.updateExampleTimestamp()
    },
    updateExampleTimestamp () {
      if (!this.timestamp.timezone.mode || !this.firstTimestamp) return

      const station = this.timestamp.timezone.example.station
      const tz = station.timezone
      const raw = this.firstTimestamp
      let utcOffset = 0
      let parsed, error

      try {
        if (this.timestamp.timezone.mode === 'GUESS') {
          utcOffset = guessUtcOffset(raw, tz)
          parsed = parseTimestamp(raw, utcOffset)
        } else if (this.timestamp.timezone.mode === 'UTCOFFSET') {
          if (this.timestamp.timezone.utcOffset.selected) {
            utcOffset = this.timestamp.timezone.utcOffset.selected.value
            parsed = parseTimestamp(raw, utcOffset)
          }
        } else if (this.timestamp.timezone.mode === 'TIMESTAMP') {
          parsed = parseTimestamp(raw)
        } else if (this.timestamp.timezone.mode === 'COLUMN') {
          if (this.timestamp.timezone.column.selected) {
            const column = this.timestamp.timezone.column.selected
            utcOffset = this.file.parsed.data[0][column]
            parsed = parseTimestamp(raw, utcOffset)
          }
        }

        if (parsed && !parsed.isValid()) {
          throw new Error(`Failed to parse timestamp ('${raw}') with utcOffset=${utcOffset}`)
        }
      } catch (err) {
        console.error(err)
        error = err.toString()
      }

      this.timestamp.timezone.example = {
        station,
        tz,
        raw,
        utcOffset,
        parsed,
        error
      }
    },
    nextTimestamp () {
      this.timestamp.error = null

      if (!this.timestamp.mode ||
          !this.$refs.timestampForm.validate() ||
          !this.timestamp.timezone.mode ||
          this.timestamp.timezone.example.error) {
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

      if (!this.$refs.metaForm.validate()) {
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
        this.upload.error = this.$errorMessage(err)
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
        this.upload.error = this.$errorMessage(err)

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
        this.upload.error += this.$errorMessage(err)

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
        type: null,
        file: {
          filename: this.file.selected.name,
          skipLines: this.file.skipLines || 0
        },
        station: {
          mode: this.station.mode
        },
        depth: {
          category: this.depth.category.selected,
          value: this.depth.value.selected,
          column: this.depth.column.selected,
          units: this.depth.units.selected
        },
        timestamp: {
          timezone: {}
        },
        value: {
          column: this.value.column.selected,
          units: this.value.units.selected,
          missing: this.value.missing.selected,
          flagColumn: this.value.flagColumn.selected
        },
        meta: {}
      }

      switch (this.file.type) {
        case 'PROFILES':
          config.type = 'PROFILES'
          break
        case 'SERIES_CONTINUOUS':
          config.type = 'SERIES'
          config.meta.interval = 'CONTINUOUS'
          break
        case 'SERIES_DISCRETE':
          config.type = 'SERIES'
          config.meta.interval = 'DISCRETE'
          break
        default:
          config.type = null
      }

      switch (this.station.mode) {
        case 'STATION':
          config.station.stationId = this.station.station.selected.id
          break
        case 'COLUMN':
          config.station.column = this.station.column.selected
          break
      }

      switch (this.timestamp.mode) {
        case 'COMBINED':
          config.timestamp.columns = [
            this.timestamp.combined.column.selected
          ]
          break
        case 'SEPARATE':
          config.timestamp.columns = [
            this.timestamp.separate.date.column.selected,
            this.timestamp.separate.time.column.selected
          ]
          break
      }

      switch (this.timestamp.mode) {
        case 'COMBINED':
          config.timestamp.columns = [
            this.timestamp.combined.column.selected
          ]
          break
        case 'SEPARATE':
          config.timestamp.columns = [
            this.timestamp.separate.date.column.selected,
            this.timestamp.separate.time.column.selected
          ]
          break
      }

      config.timestamp.timezone.mode = this.timestamp.timezone.mode
      switch (this.timestamp.timezone.mode) {
        case 'COLUMN':
          config.timestamp.timezone.column = this.timestamp.timezone.column.selected
          break
        case 'UTCOFFSET':
          config.timestamp.timezone.utcOffset = this.timestamp.timezone.utcOffset.selected.value
          break
      }

      config.meta.sop_bath = parseBooleanOption(this.meta.sop_bath)
      config.meta.accuracy = this.meta.accuracy.selected
      config.meta.reviewed = parseBooleanOption(this.meta.reviewed)

      return config
    },
    async createFile () {
      if (!this.file.selected) throw new Error('File not found')
      const organizationId = this.organization.selected.id
      const filename = this.file.selected.name
      const config = this.createFileConfig()

      const response = await this.$http.restricted.post(`/organizations/${organizationId}/files`, {
        filename,
        type: config.type,
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
        console.log(`Failed to delete file (id=${file.id})`)
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
