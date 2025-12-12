import request from 'supertest';
import app from '../index.js';

test('version check' ,  async () => {
const response =  await request(app).get('/version')
expect(response.text).toContain("API running");
})








test('1 + 1 equals 2', () => {
  expect(1 + 1).toBe(2);
});