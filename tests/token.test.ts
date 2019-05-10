const { createAccessToken, verifyAccessToken } = require('../lib/jwt');
const { config } = require('../lib/config');

beforeAll(() => {
  config.setItem('secret', 'hiugugugjvvufuyfuyf');
});

test('测试token生成，验证', () => {
  const token = createAccessToken({
    nickname: 'pedro',
    exp: Math.floor(Date.now() / 1000) + 60 * 60
  });
  expect(token).not.toBe('');
  console.log(token);
  const decode = verifyAccessToken(token);
  const date = new Date(decode['exp'] * 1000);
  console.log(date);
});
