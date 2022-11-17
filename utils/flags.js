const debug = require('./debug')
const { emptyStringToNull } = require('./utils')

exports.flagLabel = function (d) {
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
