import Vue from 'vue'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import timezone from 'dayjs/plugin/timezone'
import advancedFormat from 'dayjs/plugin/advancedFormat'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import localizedFormat from 'dayjs/plugin/localizedFormat'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'

dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(advancedFormat)
dayjs.extend(customParseFormat)
dayjs.extend(relativeTime)
dayjs.extend(localizedFormat)
dayjs.extend(isBetween)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

dayjs.tz.setDefault('UTC')

Object.defineProperties(Vue.prototype, {
  $date: {
    get () {
      return dayjs
    }
  }
})

export function countDays (startTimestamp, endTimestamp, tz) {
  if (!startTimestamp || !endTimestamp) return
  const start = dayjs(startTimestamp).tz(tz)
  const end = dayjs(endTimestamp).tz(tz)
  return start.isValid() && end.isValid() ? end.diff(start, 'day') + 1 : 0
}

window.dayjs = dayjs
