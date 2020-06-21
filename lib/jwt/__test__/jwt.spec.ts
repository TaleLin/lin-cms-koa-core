import { config } from '../../config'
import path from 'path'

config.init(path.resolve(__dirname, '../../../'))
config.getConfigFromFile('test/config.js');
config.setItem('secret', 'secret')
config.setItem('accessExp', 1)  // 1s 后过期
config.setItem('refreshExp', 1) // 1s 后过期

const sleep = (delay: number) => {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()   
    }, delay);
  })
}

describe('测试令牌', () => {
  const TEST_EXP = 30; // 30s
  const REFRESH_EXP = 60 * 60 * 24 * 30 * 3; // 3 months
  const SECRET = 'secret';
  const { InvalidTokenException, ExpiredTokenException } =  require('../../exception');

  describe('测试 Token', () => {
    const { Token } = require('../index'); 

    it('测试令牌生成', () => {
      const token = new Token(SECRET, TEST_EXP, REFRESH_EXP);
    
      const access = token.createAccessToken('pedro');
      const refresh = token.createRefreshToken('pedro');
  
      expect(access).not.toBe(null);
      expect(refresh).not.toBe(null);
    });

    it('测试令牌损坏', () => {
      const token = new Token(SECRET, TEST_EXP, REFRESH_EXP);
    
      const access = token.createAccessToken('secret');
      const refresh = token.createRefreshToken('secret');
    
      expect(access).not.toBe(null);
      expect(refresh).not.toBe(null);
    
      const obj = token.verifyToken(access);
      expect(obj).toHaveProperty('identity', 'secret');
    
      expect(() => {
        token.verifyToken(access + 's');
      }).toThrow(new InvalidTokenException({}));
    });

    it('测试令牌过期', async () => {
      const TEST_EXP = 1 // 1s 后过期
      const REFRESH_EXP = 1

      const token = new Token(SECRET, TEST_EXP, REFRESH_EXP);

      const access = token.createAccessToken('secret');
      const refresh = token.createRefreshToken('secret');

      expect(access).not.toBe(null);
      expect(refresh).not.toBe(null);

      await sleep(1000)

      expect(() => {
        token.verifyToken(access);
      }).toThrow(new ExpiredTokenException({}));
    })
  })

  describe('测试 AccessToken 和 RefreshToken', () => {
    const {
      createAccessToken,
      createRefreshToken,
      verifyAccessToken,
      verifyRefreshToken
    } = require('../index'); 

    it('测试 Token 生成', () => {
      const access = createAccessToken({ name: 'shirmy' });
      const refresh = createRefreshToken({ name: 'shirmy' });
      
      expect(access).not.toBe(null);
      expect(refresh).not.toBe(null);
  
      const decodeAccess = verifyAccessToken(access)
      const decodeRefresh = verifyRefreshToken(refresh)
  
      expect(decodeAccess.name).toBe('shirmy')
      expect(decodeRefresh.name).toBe('shirmy')
    })

    it('测试 Token 失效', () => {
      const access = createAccessToken({ name: 'shirmy' });
      const refresh = createRefreshToken({ name: 'shirmy' });

      expect(access).not.toBe(null);
      expect(refresh).not.toBe(null);

      expect(() => {
        verifyAccessToken(access + 'invalid');
      }).toThrow(new InvalidTokenException({ code: 10041 }));

      expect(() => {
        verifyRefreshToken(refresh + 'invalid');
      }).toThrow(new InvalidTokenException({ code: 10042 }));
    })

    it('测试 Token 过期', async () => {
      const access = createAccessToken({ name: 'shirmy' });
      const refresh = createRefreshToken({ name: 'shirmy' });

      expect(access).not.toBe(null);
      expect(refresh).not.toBe(null);

      await sleep(1000)

      expect(() => {
        verifyAccessToken(access);
      }).toThrow(new ExpiredTokenException({ code: 10051 }));

      expect(() => {
        verifyRefreshToken(refresh);
      }).toThrow(new ExpiredTokenException({ code: 10052 }));
    })
  })
})
