/* eslint-env jest */
const app = require('../app')
const knex = require('aktemp-db')

const request = require('supertest')

describe('public api', () => {
  beforeAll(async () => {
    await knex.migrate.latest()
    await knex.seed.run()
  })

  afterAll(async () => {
    await knex.migrate.rollback()
    await knex.destroy()
  })

  test('GET /', async () => {
    const response = await request(app).get('/public')
    expect(response.statusCode).toBe(200)
  })

  test('GET /organizations', async () => {
    const response = await request(app).get('/public/organizations')
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.body)).toBeTruthy()
    expect(response.body).toHaveLength(2)
  })

  test('GET /stations', async () => {
    const response = await request(app).get('/public/stations')
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.body)).toBeTruthy()
    expect(response.body).toHaveLength(1)
  })

  test('GET /stations/:id', async () => {
    const response = await request(app).get('/public/stations/1')
    expect(response.statusCode).toBe(200)
    expect(response.body).toBeTruthy()
    expect(response.body.code).toBe('UAA_001')
  })

  test('GET /stations/:id (404)', async () => {
    const response = await request(app).get('/public/stations/100')
    expect(response.statusCode).toBe(404)
    expect(response.body.code).toBeUndefined()
  })

  test('GET /stations/:id/series', async () => {
    const response = await request(app).get('/public/stations/1/series')
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.body)).toBeTruthy()
    expect(response.body).toHaveLength(1)
  })

  test('GET /stations/:id/series/:id (404)', async () => {
    const response = await request(app).get('/public/stations/1/series/100')
    expect(response.statusCode).toBe(404)
    expect(response.body.id).toBeUndefined()
  })

  test('GET /stations/:id/profiles', async () => {
    const response = await request(app).get('/public/stations/1/profiles')
    expect(response.statusCode).toBe(200)
    expect(Array.isArray(response.body)).toBeTruthy()
    expect(response.body).toHaveLength(0)
  })

  test('GET /stations/:id/profiles/:id (404)', async () => {
    const response = await request(app).get('/public/stations/1/profiles/1')
    expect(response.statusCode).toBe(404)
    expect(response.body.id).toBeUndefined()
  })

  test('GET /series/:id', async () => {
    const response = await request(app).get('/public/series/1')
    expect(response.statusCode).toBe(200)
    expect(response.body).toBeTruthy()
    expect(response.body.station_code).toBeTruthy()
    expect(response.body.organization_code).toBeTruthy()
    expect(response.body.values).toBeUndefined()
  })

  test('GET /series/:id/values', async () => {
    const response = await request(app).get('/public/series/1/values')
    expect(response.statusCode).toBe(200)
    expect(response.body).toBeTruthy()
    expect(Array.isArray(response.body)).toBeTruthy()
  })

  test('GET /series/:id/daily', async () => {
    const response = await request(app).get('/public/series/1/daily')
    expect(response.statusCode).toBe(200)
    expect(response.body).toBeTruthy()
    expect(Array.isArray(response.body)).toBeTruthy()
  })
})
