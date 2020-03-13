// import { request, context, response } from '../../utils';
import Koa from 'koa';
import { error } from '../error';
import request from 'supertest';

test('测试error中间件', async () => {
  const app = new Koa();
  app.on('error', error);

  app.use(async ctx => {
    throw new Error('gg');
    ctx.body = 'hello lin';
  });

  const response = await request(app.callback()).get('/');
  // .send({
  //   nickname: 'pedro',
  //   group_id: 1,
  //   password: '123456',
  //   confirm_password: '123455'
  // });
  expect(response.status).toBe(500);
});
