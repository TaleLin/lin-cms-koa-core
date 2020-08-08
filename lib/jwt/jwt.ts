import Application from 'koa';
import jwtGenerator, {
  TokenExpiredError,
  VerifyOptions,
  SignOptions
} from 'jsonwebtoken';
import {
  ExpiredTokenException,
  InvalidTokenException,
  AuthFailed
} from '../exception';
import { RouterContext } from 'koa-router';
import { get } from 'lodash';
import { TokenType } from '../utils';
import { config } from '../config';

/**
 * 令牌类，提供令牌的生成和解析功能
 *
 * ```js
 * const jwt = new Token(
 * config.getItem("secret"),
 * config.getItem("accessExp"),
 * config.getItem("refreshExp")
 * );
 * ```
 */
class Token {
  /**
   * 令牌的secret值，用于令牌的加密
   */
  public secret: string | undefined;

  /**
   * access token 默认的过期时间
   */
  public accessExp: number = 60 * 60; // 1h;

  /**
   * refresh token 默认的过期时间
   */
  public refreshExp: number = 60 * 60 * 24 * 30 * 3; // 3 months

  /**
   * 构造函数
   * @param secret 牌的secret值
   * @param accessExp access token 过期时间
   * @param refreshExp refresh token 过期时间
   */
  constructor(secret?: string, accessExp?: number, refreshExp?: number) {
    secret && (this.secret = secret);
    refreshExp && (this.refreshExp = refreshExp);
    accessExp && (this.accessExp = accessExp);
  }

  /**
   * 挂载到 ctx 上
   */
  public initApp(
    app: Application,
    secret?: string,
    accessExp?: number,
    refreshExp?: number
  ) {
    // 将 jwt 实例挂到 app 的 context 上
    app.context.jwt = this;
    secret && (this.secret = secret);
    refreshExp && (this.refreshExp = refreshExp);
    accessExp && (this.accessExp = accessExp);
  }

  /**
   * 生成access_token
   * @param identity 标识位
   */
  public createAccessToken(identity: string | number) {
    if (!this.secret) {
      throw new Error('secret can not be empty');
    }
    let exp: number = Math.floor(Date.now() / 1000) + this.accessExp;
    return jwtGenerator.sign(
      {
        exp,
        identity,
        scope: 'lin',
        type: TokenType.ACCESS
      },
      this.secret
    );
  }

  /**
   * 生成refresh_token
   * @param identity 标识位
   */
  public createRefreshToken(identity: string | number) {
    if (!this.secret) {
      throw new Error('secret can not be empty');
    }
    let exp: number = Math.floor(Date.now() / 1000) + this.refreshExp;
    return jwtGenerator.sign(
      {
        exp,
        identity,
        scope: 'lin',
        type: TokenType.REFRESH
      },
      this.secret
    );
  }

  /**
   * verifyToken 验证token
   * 若过期，抛出ExpiredTokenException
   * 若失效，抛出InvalidTokenException
   *
   * @param token 令牌
   */
  public verifyToken(token: string, type = TokenType.ACCESS) {
    if (!this.secret) {
      throw new Error('secret can not be empty');
    }
    // NotBeforeError
    // TokenExpiredError
    let decode;
    try {
      decode = jwtGenerator.verify(token, this.secret);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        if (type === TokenType.ACCESS) {
          throw new ExpiredTokenException({
            code: 10051
          });
        } else if (type === TokenType.REFRESH) {
          throw new ExpiredTokenException({
            code: 10052
          });
        } else {
          throw new ExpiredTokenException();
        }
      } else {
        if (type === TokenType.ACCESS) {
          throw new InvalidTokenException({
            code: 10041
          });
        } else if (type === TokenType.REFRESH) {
          throw new InvalidTokenException({
            code: 10042
          });
        } else {
          throw new InvalidTokenException();
        }
      }
    }
    return decode;
  }
}

/**
 * jwt 的实例
 */
const jwt = new Token(
  config.getItem('secret'),
  config.getItem('accessExp'),
  config.getItem('refreshExp')
);

/**
 * 生成access token
 * @param payload 负载，支持 string 和 object
 * @param options 参数
 */
function createAccessToken(payload: string | object, options?: SignOptions) {
  // type: TokenType.REFRESH
  let exp: number = Math.floor(Date.now() / 1000) + jwt.accessExp;
  if (typeof payload === 'string') {
    return jwtGenerator.sign(
      { indentify: payload, type: TokenType.ACCESS, exp: jwt.accessExp },
      jwt.secret!,
      options
    );
  } else {
    return jwtGenerator.sign(
      { ...payload, type: TokenType.ACCESS, exp: exp },
      jwt.secret!,
      options
    );
  }
}

/**
 * 生成refresh token
 * @param payload 负载，支持 string 和 object
 * @param options 参数
 */
function createRefreshToken(payload: string | object, options?: SignOptions) {
  let exp: number = Math.floor(Date.now() / 1000) + jwt.refreshExp;
  // type: TokenType.REFRESH
  if (typeof payload === 'string') {
    return jwtGenerator.sign(
      { indentify: payload, type: TokenType.REFRESH, exp: jwt.refreshExp },
      jwt.secret!,
      options
    );
  } else {
    return jwtGenerator.sign(
      { ...payload, type: TokenType.REFRESH, exp: exp },
      jwt.secret!,
      options
    );
  }
}

/**
 * 验证 access token
 * @param token 令牌
 * @param options 选项
 */
function verifyAccessToken(token: string, options?: VerifyOptions) {
  let decode;
  try {
    decode = jwtGenerator.verify(token, jwt.secret!, options);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new ExpiredTokenException({
        code: 10051
      });
    } else {
      throw new InvalidTokenException({
        code: 10041
      });
    }
  }
  if (!decode['type'] || decode['type'] !== TokenType.ACCESS) {
    throw new InvalidTokenException();
  }
  return decode;
}

/**
 * 验证 refresh token
 * @param token 令牌
 * @param options 选项
 */
function verifyRefreshToken(token: string, options?: VerifyOptions) {
  let decode;
  try {
    decode = jwtGenerator.verify(token, jwt.secret!, options);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new ExpiredTokenException({
        code: 10052
      });
    } else {
      throw new InvalidTokenException({
        code: 10042
      });
    }
  }
  if (!decode['type'] || decode['type'] !== TokenType.REFRESH) {
    throw new InvalidTokenException();
  }
  return decode;
}

/**
 * 颁发令牌
 * @param user 用户
 */
function getTokens(user) {
  const accessToken = jwt.createAccessToken(user.id);
  const refreshToken = jwt.createRefreshToken(user.id);
  return { accessToken, refreshToken };
}

/**
 * 解析请求头
 * @param ctx koa 的context
 * @param type 令牌的类型
 */
function parseHeader(ctx: RouterContext, type = TokenType.ACCESS) {
  // 此处借鉴了koa-jwt
  if (!ctx.header || !ctx.header.authorization) {
    ctx.throw(new AuthFailed({ code: 10013 }));
  }
  const parts = ctx.header.authorization.split(' ');

  if (parts.length === 2) {
    // Bearer 字段
    const scheme = parts[0];
    // token 字段
    const token = parts[1];

    if (/^Bearer$/i.test(scheme)) {
      // @ts-ignore
      const obj = ctx.jwt.verifyToken(token, type);
      if (!get(obj, 'type') || get(obj, 'type') !== type) {
        ctx.throw(new AuthFailed({ code: 10250 }));
      }
      if (!get(obj, 'scope') || get(obj, 'scope') !== 'lin') {
        ctx.throw(new AuthFailed({ code: 10251 }));
      }
      return obj;
    }
  } else {
    ctx.throw(new AuthFailed());
  }
}

export {
  Token,
  jwt,
  getTokens,
  parseHeader,
  createAccessToken,
  createRefreshToken,
  verifyAccessToken,
  verifyRefreshToken
};
