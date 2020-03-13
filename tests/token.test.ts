const { createAccessToken, verifyAccessToken } = require('../lib/jwt');
const { config } = require('../lib/config');

beforeAll(() => {
  config.setItem('secret', 'hiugugugjvvufuyfuyf');
  console.log('config', config);
});

test('测试token生成，验证', () => {

  const access = createAccessToken({
    name: 'Evan',
    position: 'software engineer'
  })

  expect(access).not.toBe('');
  console.log(access);
  const decode = verifyAccessToken(access)
  console.log(decode);
  const date = new Date(decode['exp'] * 1000);
  console.log(date);
});
