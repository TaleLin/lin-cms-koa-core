import { Token } from '../lib/jwt';
import { InvalidTokenException, ExpiredTokenException } from '../lib/exception';

test('测试令牌生成', () => {
  const TEST_EXP = Math.floor(Date.now() / 1000) + 30; // 30s
  const REFRESH_EXP = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 * 3; // 3 months
  const SECRET = 'ui908908uhohachsoshisospowou';

  const token = new Token(SECRET, TEST_EXP, REFRESH_EXP);

  const access = token.createAccessToken('pedro');
  const refresh = token.createRefreshToken('pedro');
  console.log(access);
  console.log(refresh);
  expect(access).not.toBe(null);
  expect(refresh).not.toBe(null);
});

function sleep(delay: number) {
  let start = new Date().getTime();
  while (new Date().getTime() - start < delay) {
    continue;
  }
}

test('测试令牌过期和损坏', () => {
  const TEST_EXP = Math.floor(Date.now() / 1000) + 30; // 30s
  const REFRESH_EXP = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 * 3; // 3 month
  const SECRET = 'ui908908uhohachsoshisospowou';

  const token = new Token(SECRET, TEST_EXP, REFRESH_EXP);

  const access = token.createAccessToken(1);
  const refresh = token.createRefreshToken(1);

  console.log(access);
  console.log(refresh);
  expect(access).not.toBe(null);
  expect(refresh).not.toBe(null);

  const obj = token.verifyToken(access);
  expect(obj).toHaveProperty('identity', 1);
  console.log(obj);

  expect(() => {
    token.verifyToken(access + 's');
  }).toThrow(new InvalidTokenException({}));

  sleep(33 * 1000);
  expect(() => {
    token.verifyToken(access);
  }).toThrow(new ExpiredTokenException({}));
});
