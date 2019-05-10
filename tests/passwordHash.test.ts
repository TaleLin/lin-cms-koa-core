import { generate, verify } from '../lib/password-hash';

test('测试加密解密1', () => {
  const hash = generate('123456gpd');
  const decoded = verify('123456gpd', hash);
  console.log(hash);
  console.log(decoded);
  expect(hash).not.toBe(null);
  expect(decoded).toBe(true);
});

test('测试加密解密2', () => {
  const hash = generate('123456gpdhjihh$');
  const decoded = verify('123456gpdhjihh$', hash);
  console.log(hash);
  console.log(decoded);
  expect(hash).not.toBe(null);
  expect(decoded).toBe(true);
});
