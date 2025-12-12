import request from 'supertest';
import app from '../index.js';
import { jest } from '@jest/globals';
global.fetch = jest.fn();

test('version check' , async () => {
const response =  await request(app).get('/version');
expect(response.text).toContain("API running");
})
test('1 + 1 equals 2', () => {
  expect(1 + 1).toBe(2);
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

