import request from 'supertest';
import app from '../index.js';
import { jest } from '@jest/globals';
import { app, archiveJob } from '../index.js';

jest.mock('iovalkey', () => {
  return jest.fn().mockImplementation(() => ({
    set: jest.fn().mockResolvedValue('OK'),
    get: jest.fn().mockResolvedValue(null),
    on: jest.fn(), 
    quit: jest.fn().mockResolvedValue('OK'),
  }));
});


global.fetch = jest.fn();

// 3. This is the "Cleanup" that stops the hanging process
afterAll(async () => {
  archiveJob.stop(); 
});

test('version check' , async () => {
  const response = await request(app).get('/version');
  expect(response.status).toBe(200); // Check the status too!
  expect(response.text).toContain("API running");
});

const fakeData = [
  { 
    createdAt: new Date().toISOString(), // Right now (Recent)
    value: '10' 
  },
  { 
    createdAt: '2000-01-01T00:00:00Z',   // Ancient history (Old)
    value: '100' 
  }
];

// fetch.mockResolvedValue({
//   json: () => Promise.resolve(fakeData)
// });

test('GET /temperature calculates average', async () => {

  // 1. ARRANGE: Tell fetch what to return

  fetch.mockResolvedValue({

    json: () => Promise.resolve(fakeData)

  });



  // 2. ACT: Ask the app for the page (MISSING!)

  const response = await request(app).get('/temperature')



  // 3. ASSERT: Check the answer

  expect(response.text).toContain("10");

});

