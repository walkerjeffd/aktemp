/* eslint-env jest */
const app = require('../app')
const knex = require('../db/knex')

const request = require('supertest')

describe('/restricted', () => {
  beforeAll(async () => {
    await knex.migrate.latest()
    await knex.seed.run()
  })

  afterAll(async () => {
    await knex.migrate.rollback()
    await knex.destroy()
  })

  describe('Get queries', () => {
    test('GET / (401)', async () => {
      const response = await request(app)
        .get('/restricted')
      expect(response.statusCode).toBe(401)
    })

    test('GET /', async () => {
      const response = await request(app)
        .get('/restricted')
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
    })

    test('GET /organizations/:id (404)', async () => {
      const response = await request(app)
        .get('/restricted/organizations/1')
        .auth('user', 'user')
      expect(response.statusCode).toBe(404)
    })

    test('GET /organizations/:id/stations', async () => {
      const response = await request(app)
        .get('/restricted/organizations/1/stations')
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(Array.isArray(response.body)).toBeTruthy()
      expect(response.body.length).toEqual(2)
    })

    test('GET /organizations/:id/stations/:id', async () => {
      const response = await request(app)
        .get('/restricted/organizations/1/stations/1')
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body.code).toBeTruthy()
    })

    test('GET /organizations/:id/stations/:id (404)', async () => {
      const response = await request(app)
        .get('/restricted/organizations/1/stations/3')
        .auth('user', 'user')
      expect(response.statusCode).toBe(404)
    })
  })

  describe('Manage station', () => {
    let stationId
    test('Create station', async () => {
      const response = await request(app)
        .post('/restricted/organizations/1/stations')
        .auth('user', 'user')
        .send({
          organization_id: 1,
          code: 'Test Station',
          latitude: 40,
          longitude: -70,
          timezone: 'US/Alaska'
        })
      expect(response.statusCode).toBe(201)
      expect(response.body.id).toBeTruthy()
      stationId = response.body.id
    })
    test('Get the station', async () => {
      const response = await request(app)
        .get(`/restricted/organizations/1/stations/${stationId}`)
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body.id).toBeTruthy()
    })
    test('Get the station without auth (401)', async () => {
      const response = await request(app)
        .get(`/restricted/organizations/1/stations/${stationId}`)
      expect(response.statusCode).toBe(401)
    })
    test('Update the station', async () => {
      const response = await request(app)
        .put(`/restricted/organizations/1/stations/${stationId}`)
        .auth('user', 'user')
        .send({
          code: 'Test Station (updated)'
        })
      expect(response.statusCode).toBe(200)
      expect(response.body.id).toBeTruthy()
    })
    test('Get the updated station', async () => {
      const response = await request(app)
        .get(`/restricted/organizations/1/stations/${stationId}`)
        .auth('user', 'user')
      expect(response.statusCode).toBe(200)
      expect(response.body.id).toBeTruthy()
      expect(response.body.code).toEqual('Test Station (updated)')
    })
    test('Delete the station', async () => {
      const response = await request(app)
        .delete(`/restricted/organizations/1/stations/${stationId}`)
        .auth('user', 'user')
      expect(response.statusCode).toBe(204)
    })
    test('Get the deleted station (404)', async () => {
      const response = await request(app)
        .get(`/restricted/organizations/1/stations/${stationId}`)
        .auth('user', 'user')
      expect(response.statusCode).toBe(404)
    })
  })
})
