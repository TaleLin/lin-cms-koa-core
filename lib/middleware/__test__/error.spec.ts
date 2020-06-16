import Koa from 'koa';
import request from 'supertest';
import { config } from '../../config'
import path from 'path'

config.init(path.resolve(__dirname, '../../../'))
config.getConfigFromFile('test/config.js');

describe('测试中间件', () => {
  const { error } = require('../error');
  const app = new Koa();

  it('测试error中间件', async () => {
    app.on('error', error);
  
    app.use(async ctx => {
      throw new Error('gg');
    });
  
    const response = await request(app.callback()).get('/');
    expect(response.status).toBe(500);
  });
})
