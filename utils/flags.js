const debug = require('./debug')
const { emptyStringToNull } = require('./utils')
const { luxon } = require('./time')

const flagLabel = exports.flagLabel = function (d) {
  if (!d || !d.flag_type_id) return ''
  let label = d.flag_type_id
  if (d.flag_type_id === 'OTHER') {
    label += ` [${d.flag_type_other || 'N/A'}]`
  }
  return label
}

exports.extractFlags = function (rows) {
  if (!rows || rows.length === 0) return []
  debug(`extractFlags(): n=${rows.length}`)

  if (rows.length === 1) {
    const row = rows[0]
    if (row.flag) {
      debug(`extractFlags(): single row contains flag (datetime=${row.datetime} flag=${row.flag})`)
      return [{
        start_datetime: row.datetime,
        end_datetime: row.datetime,
        flag_type_id: 'OTHER',
        flag_type_other: emptyStringToNull(row.flag)
      }]
    } else {
      return []
    }
  }

  let flag
  const flags = []
  if (rows[0].flag) {
    debug(`extractFlags(): first row contains flag (datetime=${rows[0].datetime} flag=${rows[0].flag})`)
    flag = {
      start_datetime: rows[0].datetime,
      end_datetime: null,
      flag_type_id: 'OTHER',
      flag_type_other: rows[0].flag
    }
  }
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].flag !== rows[i - 1].flag) {
      debug(`extractFlags(): flag change between rows ${i - 1} ('${rows[i - 1].flag}') and ${i} ('${rows[i].flag}')`)
      if (flag) {
        debug(`extractFlags(): end flag (datetime=${rows[i - 1].datetime} flag='${rows[i - 1].flag}')`)
        flag.end_datetime = rows[i - 1].datetime
        flags.push(flag)
      }
      if (rows[i].flag) {
        debug(`extractFlags(): start flag (datetime=${rows[i].datetime} flag='${rows[i].flag}')`)
        flag = {
          start_datetime: rows[i].datetime,
          end_datetime: null,
          flag_type_id: 'OTHER',
          flag_type_other: rows[i].flag
        }
      } else {
        flag = null
      }
    }
  }
  if (flag) {
    flag.end_datetime = rows[rows.length - 1].datetime
    flags.push(flag)
  }
  debug(`extractFlags(): done (n=${flags.length})`)
  return flags
}

exports.assignFlags = (values, flags, tz, daily = false) => {
  debug(`assignFlags(n(values)=${values.length}, n(flags)=${flags.length}, daily=${daily})`)

  if (!values || values.length === 0 || !flags || flags.length === 0) return values.map(d => ({ ...d, flag: null }))

  debug('assignFlags(): first value ->')
  debug(values[0])

  debug('assignFlags(): first flag ->')
  debug(flags[0])

  values = values.map(d => ({
    ...d,
    flag: []
  }))

  if (daily) {
    flags.forEach(flag => {
      const label = flagLabel(flag)
      const startDate = luxon.DateTime.fromJSDate(new Date(flag.start_datetime), { zone: tz }).toFormat('yyyy-MM-dd')
      const endDate = luxon.DateTime.fromJSDate(new Date(flag.end_datetime), { zone: tz }).toFormat('yyyy-MM-dd')
      values.forEach(d => {
        const date = luxon.DateTime.fromJSDate(d.date, { zone: tz }).toFormat('yyyy-MM-dd')
        if (date >= startDate && date <= endDate) {
          d.flag.push(label)
        }
      })
    })
  } else {
    flags.forEach(flag => {
      const label = flagLabel(flag)
      values.forEach(d => {
        if (new Date(d.datetime).valueOf() >= new Date(flag.start_datetime).valueOf() &&
            new Date(d.datetime).valueOf() <= new Date(flag.end_datetime).valueOf()) {
          d.flag.push(label)
        }
      })
    })
  }

  values.forEach(d => {
    d.flag = d.flag.join(',')
  })

  return values
}
