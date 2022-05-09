export const yesNoToBooleanOrNull = (value) => {
  if (value.toLowerCase() === 'yes') {
    return true
  } else if (value.toLowerCase() === 'no') {
    return false
  } else {
    return null
  }
}
export const booleanOrNullToYesNo = (value) => {
  if (value === true) return 'YES'
  else if (value === false) return 'NO'
  else return 'UNKNOWN'
}
