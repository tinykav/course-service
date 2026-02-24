const request = require('supertest');
const jwt = require('jsonwebtoken');

// ── Set env before anything loads ────────────────────────────────
process.env.JWT_SECRET = 'test_secret';
process.env.MONGO_URI = 'mongodb://localhost/test';

// ── Mock mongoose so no real DB needed ───────────────────────────
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return { ...actual, connect: jest.fn().mockResolvedValue(true) };
});

// ── Helpers ───────────────────────────────────────────────────────
const makeToken = (role = 'student') =>
  jwt.sign({ id: '507f1f77bcf86cd799439011', role }, 'test_secret');

const adminToken  = makeToken('admin');
const studentToken = makeToken('student');

let app, Course;

beforeAll(() => {
  ({ app, Course } = require('../src/index'));
});

afterEach(() => jest.clearAllMocks());

// ── Health ────────────────────────────────────────────────────────
describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok', service: 'course-service' });
  });
});

// ── GET /courses ──────────────────────────────────────────────────
describe('GET /courses', () => {
  it('returns array of courses', async () => {
    Course.find = jest.fn().mockReturnValue({
      sort: jest.fn().mockResolvedValue([
        { _id: '1', name: 'Software Engineering', capacity: 30, credits: 3 }
      ])
    });
    const res = await request(app).get('/courses');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });
});

// ── GET /courses/:id ──────────────────────────────────────────────
describe('GET /courses/:id', () => {
  it('returns 404 when not found', async () => {
    Course.findById = jest.fn().mockResolvedValue(null);
    const res = await request(app).get('/courses/507f1f77bcf86cd799439011');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Course not found');
  });

  it('returns course when found', async () => {
    Course.findById = jest.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      name: 'Cloud Computing',
      capacity: 25,
      credits: 4
    });
    const res = await request(app).get('/courses/507f1f77bcf86cd799439011');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Cloud Computing');
  });
});

// ── POST /courses ─────────────────────────────────────────────────
describe('POST /courses', () => {
  it('returns 401 with no token', async () => {
    const res = await request(app).post('/courses')
      .send({ name: 'Test', capacity: 30, credits: 3 });
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-admin', async () => {
    const res = await request(app).post('/courses')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ name: 'Test', capacity: 30, credits: 3 });
    expect(res.status).toBe(403);
  });

  it('returns 400 when fields are missing', async () => {
    const res = await request(app).post('/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test' }); // missing capacity and credits
    expect(res.status).toBe(400);
  });

  it('creates course successfully as admin', async () => {
    Course.create = jest.fn().mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      name: 'DevOps',
      capacity: 30,
      credits: 3
    });
    const res = await request(app).post('/courses')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'DevOps', capacity: 30, credits: 3 });
    expect(res.status).toBe(201);
    expect(res.body.name).toBe('DevOps');
  });
});

// ── PUT /courses/:id/capacity ─────────────────────────────────────
describe('PUT /courses/:id/capacity', () => {
  it('returns 400 for invalid action', async () => {
    const res = await request(app)
      .put('/courses/507f1f77bcf86cd799439011/capacity')
      .send({ action: 'invalid' });
    expect(res.status).toBe(400);
  });

  it('returns 400 when course is full', async () => {
    Course.findById = jest.fn().mockResolvedValue({ capacity: 0, save: jest.fn() });
    const res = await request(app)
      .put('/courses/507f1f77bcf86cd799439011/capacity')
      .send({ action: 'decrement' });
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/full/i);
  });

  it('decrements capacity successfully', async () => {
    const mockDoc = { capacity: 30, save: jest.fn().mockResolvedValue(true) };
    Course.findById = jest.fn().mockResolvedValue(mockDoc);
    const res = await request(app)
      .put('/courses/507f1f77bcf86cd799439011/capacity')
      .send({ action: 'decrement' });
    expect(res.status).toBe(200);
    expect(mockDoc.capacity).toBe(29);
  });

  it('increments capacity successfully', async () => {
    const mockDoc = { capacity: 29, save: jest.fn().mockResolvedValue(true) };
    Course.findById = jest.fn().mockResolvedValue(mockDoc);
    const res = await request(app)
      .put('/courses/507f1f77bcf86cd799439011/capacity')
      .send({ action: 'increment' });
    expect(res.status).toBe(200);
    expect(mockDoc.capacity).toBe(30);
  });
});
