const { CognitoIdentityServiceProvider } = require('aws-sdk')
const createError = require('http-errors')

const { User } = require('../../db/models')

const cognitoIdentityServiceProvider = new CognitoIdentityServiceProvider({
  region: process.env.AWS_REGION
})
const userPoolId = process.env.AWS_COGNITO_USER_POOL_ID

async function listOrganizationsForUser (id) {
  return await User.relatedQuery('organizations')
    .for(id)
}

async function attachAdminUser (req, res, next) {
  const user = await fetchUser(req.params.userId)
  if (!user) throw createError(404, `User (${req.params.userId}) not found`)
  const groups = await listGroupsForUser(user.Username)
  const organizations = await listOrganizationsForUser(user.Username)
  res.locals.adminUser = {
    id: user.Username,
    attributes: transformUserAttributes(user.UserAttributes),
    created_at: user.UserCreateDate,
    updated_at: user.UserLastModifiedDate,
    enabled: user.Enabled,
    status: user.UserStatus,
    admin: groups.includes('admins'),
    organizations
  }
  return next()
}

async function createCognitoUser (email, name) {
  const params = {
    UserPoolId: userPoolId,
    Username: email,
    DesiredDeliveryMediums: ['EMAIL'],
    UserAttributes: [
      {
        Name: 'name',
        Value: name
      },
      {
        Name: 'email',
        Value: email
      },
      {
        Name: 'email_verified',
        Value: 'true'
      }
    ]
  }
  const response = await cognitoIdentityServiceProvider.adminCreateUser(params).promise()
  return response.User
}

async function createDatabaseUser (user) {
  return await User.query().insert(user).returning('*')
}

async function deleteCognitoUser (id) {
  console.log(`deleteUser (${id})`)
  const params = {
    UserPoolId: userPoolId,
    Username: id
  }

  await cognitoIdentityServiceProvider.adminDeleteUser(params).promise()
  return {
    message: `User (${id}) has been deleted`
  }
}

async function deleteUser (req, res, next) {
  await deleteCognitoUser(res.locals.adminUser.id)
  return res.status(204).json()
}

async function postUsers (req, res, next) {
  const { email, name, admin } = req.body // eslint-disable-line

  const cognitoUser = await createCognitoUser(email, name)
  if (admin) {
    await addUserToGroup(cognitoUser.Username, 'admins')
  }

  await createDatabaseUser({
    id: cognitoUser.Username
  })

  return res.status(201).json(cognitoUser)
}

async function addUserToGroup (id, groupname) {
  console.log(`addUserToGroup (${id}, ${groupname})`)
  const params = {
    GroupName: groupname,
    UserPoolId: userPoolId,
    Username: id
  }

  await cognitoIdentityServiceProvider.adminAddUserToGroup(params).promise()
  return {
    message: `User (${id}) added to group (${groupname})`
  }
}

async function removeUserFromGroup (id, groupname) {
  console.log(`removeUserFromGroup (${id}, ${groupname})`)
  const params = {
    GroupName: groupname,
    UserPoolId: userPoolId,
    Username: id
  }

  await cognitoIdentityServiceProvider.adminRemoveUserFromGroup(params).promise()
  return {
    message: `User (${id}) removed from group (${groupname})`
  }
}

async function disableUser (id) {
  console.log(`disableUser(${id})`)
  const params = {
    UserPoolId: userPoolId,
    Username: id
  }

  await cognitoIdentityServiceProvider.adminDisableUser(params).promise()
  return {
    message: `User (${id}) disabled`
  }
}

async function enableUser (id) {
  console.log(`enableUser(${id})`)
  const params = {
    UserPoolId: userPoolId,
    Username: id
  }

  await cognitoIdentityServiceProvider.adminEnableUser(params).promise()
  return {
    message: `User (${id}) enabled`
  }
}

function transformUserAttributes (attributes) {
  const transformed = {}
  attributes.forEach(a => {
    transformed[a.Name] = a.Value
  })
  return transformed
}

async function listUsers (users, token, iter) {
  users = users || []
  iter = iter || 0
  console.log(`listUsers(iter=${iter})`)

  const params = {
    UserPoolId: userPoolId,
    PaginationToken: token || null
  }

  const result = await cognitoIdentityServiceProvider.listUsers(params).promise()
  users = [...(users || []), ...result.Users]
  if (result.PaginationToken) {
    return await listUsers(users, result.PaginationToken, iter + 1)
  }

  const adminUsers = await listUsersInGroup('admins')
  const adminUserIds = adminUsers.map(d => d.Username)

  return users.map(d => ({
    id: d.Username,
    attributes: transformUserAttributes(d.Attributes),
    created_at: d.UserCreateDate,
    updated_at: d.UserLastModifiedDate,
    enabled: d.Enabled,
    status: d.UserStatus,
    admin: adminUserIds.includes(d.Username)
  }))
}

async function listUsersInGroup (groupname, users, token, iter) {
  users = users || []
  iter = iter || 0
  console.log(`listUsersInGroup(groupname=${groupname},iter=${iter})`)

  const params = {
    GroupName: groupname,
    UserPoolId: userPoolId,
    NextToken: token || null
  }

  const result = await cognitoIdentityServiceProvider.listUsersInGroup(params).promise()

  users = [...(users || []), ...result.Users]

  if (result.NextToken) {
    return await listUsers(groupname, [...users, ...result.Users], result.NextToken)
  }

  return users
}

async function listGroupsForUser (id) {
  const params = {
    UserPoolId: userPoolId,
    Username: id
  }

  const result = await cognitoIdentityServiceProvider.adminListGroupsForUser(params).promise()
  return result.Groups.map(d => d.GroupName)
}

async function getUsers (req, res, next) {
  let users = []
  try {
    users = await listUsers()
  } catch (err) {
    console.log(err)
    return next(createError(500, 'Failed to list users'))
  }

  res.status(200).json(users)
}

async function fetchUser (id) {
  console.log(`fetchUser(${id})`)
  const params = {
    UserPoolId: userPoolId,
    Username: id
  }
  try {
    return await cognitoIdentityServiceProvider.adminGetUser(params).promise()
  } catch (err) {
    if (err.code && err.code === 'UserNotFoundException') {
      console.log(`user (${id}) not found`)
      return null
    }
    console.log(err)
    throw createError(500, 'Failed to get user')
  }
}

async function getUser (req, res, next) {
  res.status(200).json(res.locals.adminUser)
}

async function putUser (req, res, next) {
  let response
  if (req.body.action === 'enable') {
    response = await enableUser(res.locals.adminUser.id)
  } else if (req.body.action === 'disable') {
    response = await disableUser(res.locals.adminUser.id)
  } else if (req.body.action === 'addToAdmin') {
    response = await addUserToGroup(res.locals.adminUser.id, 'admins')
  } else if (req.body.action === 'removeFromAdmin') {
    response = await removeUserFromGroup(res.locals.adminUser.id, 'admins')
  } else if (req.body.action === 'signOut') {
    response = await signOutUser(res.locals.adminUser.id)
  } else {
    throw createError(400, 'Invalid user action')
  }
  return res.status(200).json(response)
}

async function signOutUser (id) {
  const params = {
    UserPoolId: userPoolId,
    Username: id
  }

  await cognitoIdentityServiceProvider.adminUserGlobalSignOut(params).promise()
  return {
    message: `User (${id}) signed out from all devices`
  }
}

module.exports = {
  attachAdminUser,
  getUsers,
  postUsers,
  getUser,
  putUser,
  deleteUser
}