export const passwordStrength = (value) => {
  // Minimum of 1 Uppercase Letter
  if (/[A-Z]/.test(value) === false) { return false }

  // Minimum of 1 Lowercase Letter
  if (/[a-z]/.test(value) === false) { return false }

  // Minimum of 1 Number
  if (/\d/.test(value) === false) { return false }

  return true
}

export const email = (value) => {
  const re =
    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ // eslint-disable-line
  return re.test(String(value))
}

export const codeCharacters = (value) => {
  const re = /^[A-Z0-9_]*$/
  return re.test(String(value))
}

export const rules = {
  request: {
    name: [
      v => !!v || 'Name is required'
    ],
    email: [
      v => !!v || 'Email is required',
      v => (!!v && email(v)) || 'Must be a valid email address'
    ],
    description: [
      v => !!v || 'Description is required',
      v => (!!v && v.length <= 500) || 'Description cannot exceed 500 characters'
    ]
  },
  user: {
    name: [
      v => !!v || 'Name is required'
    ],
    email: [
      v => !!v || 'Email is required',
      v => email(v) || 'Must be a valid email address'
    ]
  },
  provider: {
    code: [
      v => !!v || 'Provider code is required',
      v => v.length <= 50 || 'Provider code cannot exceed 50 characters'
    ],
    name: [
      v => !!v || 'Provider name is required',
      v => v.length <= 128 || 'Provider name cannot exceed 128 characters'
    ],
    pocName: [],
    pocEmail: [
      v => !v || (!!v && email(v)) || 'Must be a valid email address'
    ]
  },
  organization: {
    code: [
      v => !!v || 'Organization code is required',
      v => v.length <= 50 || 'Organization code cannot exceed 50 characters'
    ],
    name: [
      v => !!v || 'Organization name is required',
      v => v.length <= 128 || 'Organization name cannot exceed 128 characters'
    ]
  }
}
