import { jest } from '@jest/globals';
import request from 'supertest';

// 1. MOCK IOREDIS (Must come BEFORE importing 'app')
// This prevents the ENOTFOUND valkey-service error
jest.unstable_mockModule('ioredis', () => {
  return {
    default: class {
      on() { return this; }
      get() { return Promise.resolve(null); }
      set() { return Promise.resolve('OK'); }
      quit() { return Promise.resolve('OK'); }
    }
  };
});

// 2. IMPORT APP & EXPORTS
// We import these AFTER the mock is defined
const { default: app, archiveJob, valkey, server } = await import('../src/index.js');

// 3. MOCK GLOBAL FETCH
global.fetch = jest.fn();

// 4. CLEANUP AFTER ALL TESTS
afterAll(async () => {
  // Stop the cron job
  if (archiveJob) archiveJob.stop();

  // Close the Express server
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }

  // Disconnect from Valkey (the mocked quit)
  if (valkey) {
    await valkey.quit();
  }
});

// ==========================================
// TESTS
// ==========================================

test('version check', async () => {
  const response = await request(app).get('/version');
  expect(response.status).toBe(200);
  expect(response.text).toContain("API running");
});

test('GET /temperature calculates average', async () => {
  const fakeData = [
    { sensors: [{ lastMeasurement: { value: '10' } }] },
    { sensors: [{ lastMeasurement: { value: '20' } }] }
  ];

  global.fetch.mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(fakeData)
  });

  const response = await request(app).get('/temperature');

  expect(response.status).toBe(200);
  // Average of 10 and 20 is 15
  expect(response.body.averageTemp).toBe(15);
});