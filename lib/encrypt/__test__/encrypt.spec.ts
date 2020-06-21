import { generate, verify } from '../index';

describe('测试加密解密', () => {
  it('测试加密解密 1', () => {
    const hash = generate('123456gpd');
    const decoded = verify('123456gpd', hash);
    expect(hash).not.toBe(null);
    expect(decoded).toBe(true);
  })

  it('测试加密解密 2', () => {
    const hash = generate('123456gpdhjihh$');
    const decoded = verify('123456gpdhjihh$', hash);
    expect(hash).not.toBe(null);
    expect(decoded).toBe(true);
  });
})