import jwtGenerator, {
  TokenExpiredError,
  VerifyOptions,
  SignOptions
} from 'jsonwebtoken';
import {
  ExpiredTokenException,
  InvalidTokenException,
  AuthFailed,
  NotFound,
  RefreshException
} from './exception';
import Application from 'koa';
import { RouterContext } from 'koa-router';
import { get } from 'lodash';
import { routeMetaInfo } from './core';
import { TokenType } from './enums';
import { config } from './config';

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
export class Token {
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
    // 将jwt实例挂到app的context上
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
      throw new Error('密匙不可为空');
    }
    let exp: number = Math.floor(Date.now() / 1000) + this.accessExp;
    return jwtGenerator.sign(
      {
        exp: exp,
        identity: identity,
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
      throw new Error('密匙不可为空');
    }
    let exp: number = Math.floor(Date.now() / 1000) + this.refreshExp;
    return jwtGenerator.sign(
      {
        exp: exp,
        identity: identity,
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
  public verifyToken(token: string) {
    if (!this.secret) {
      throw new Error('密匙不可为空');
    }
    // NotBeforeError
    // TokenExpiredError
    let decode;
    try {
      decode = jwtGenerator.verify(token, this.secret);
    } catch (error) {
      if (error instanceof TokenExpiredError) {
        throw new ExpiredTokenException();
      } else {
        throw new InvalidTokenException();
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
export function createAccessToken(
  payload: string | object,
  options?: SignOptions
) {
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
export function createRefreshToken(
  payload: string | object,
  options?: SignOptions
) {
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
export function verifyAccessToken(token: string, options?: VerifyOptions) {
  let decode;
  try {
    decode = jwtGenerator.verify(token, jwt.secret!, options);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new ExpiredTokenException();
    } else {
      throw new InvalidTokenException();
    }
  }
  if (!decode['type'] || decode['type'] !== TokenType.ACCESS) {
    throw new InvalidTokenException({ msg: '令牌类型错误' });
  }
  return decode;
}

/**
 * 验证 refresh token
 * @param token 令牌
 * @param options 选项
 */
export function verifyRefreshToken(token: string, options?: VerifyOptions) {
  let decode;
  try {
    decode = jwtGenerator.verify(token, jwt.secret!, options);
  } catch (error) {
    if (error instanceof TokenExpiredError) {
      throw new ExpiredTokenException();
    } else {
      throw new InvalidTokenException();
    }
  }
  if (!decode['type'] || decode['type'] !== TokenType.REFRESH) {
    throw new InvalidTokenException({ msg: '令牌类型错误' });
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
async function parseHeader(ctx: RouterContext, type = TokenType.ACCESS) {
  // 此处借鉴了koa-jwt
  if (!ctx.header || !ctx.header.authorization) {
    ctx.throw(new AuthFailed({ msg: '认证失败，请检查请求令牌是否正确' }));
  }
  const parts = ctx.header.authorization.split(' ');

  if (parts.length === 2) {
    // Bearer 字段
    const scheme = parts[0];
    // token 字段
    const token = parts[1];

    if (/^Bearer$/i.test(scheme)) {
      // @ts-ignore
      const obj = ctx.jwt.verifyToken(token);
      if (!get(obj, 'type') || get(obj, 'type') !== type) {
        ctx.throw(new AuthFailed({ msg: '请使用正确类型的令牌' }));
      }
      if (!get(obj, 'scope') || get(obj, 'scope') !== 'lin') {
        ctx.throw(new AuthFailed({ msg: '请使用正确作用域的令牌' }));
      }
      // @ts-ignore
      const user = await ctx.manager.userModel.findByPk(get(obj, 'identity'));
      if (!user) {
        ctx.throw(new NotFound({ msg: '用户不存在' }));
      }
      // 将user挂在ctx上
      // @ts-ignore
      ctx.currentUser = user;
    }
  } else {
    ctx.throw(new AuthFailed());
  }
}

function checkUserIsActive(user) {
  if (!user || !user.isActive) {
    throw new AuthFailed({ msg: '您目前处于未激活状态，请联系超级管理员' });
  }
}

/**
 * 守卫函数，用户登陆即可访问
 */
async function loginRequired(ctx: RouterContext, next: () => Promise<any>) {
  if (ctx.request.method !== 'OPTIONS') {
    await parseHeader(ctx);
    // 一定要await，否则这个守卫函数没有作用
    // 用户处于未激活状态
    // @ts-ignore
    const currentUser = ctx.currentUser;
    checkUserIsActive(currentUser);
    await next();
  } else {
    await next();
  }
}

/**
 * 守卫函数，用户刷新令牌
 */
async function refreshTokenRequired(
  ctx: RouterContext,
  next: () => Promise<any>
) {
  // 添加access 和 refresh 的标识位
  if (ctx.request.method !== 'OPTIONS') {
    await parseHeader(ctx, TokenType.REFRESH);
    await next();
  } else {
    await next();
  }
}

/**
 * 守卫函数，用户刷新令牌，统一异常
 */
async function refreshTokenRequiredWithUnifyException(
  ctx: RouterContext,
  next: () => Promise<any>
) {
  // 添加access 和 refresh 的标识位
  if (ctx.request.method !== 'OPTIONS') {
    try {
      await parseHeader(ctx, TokenType.REFRESH);
    } catch (error) {
      throw new RefreshException();
    }
    await next();
  } else {
    await next();
  }
}

/**
 * 守卫函数，用于权限组鉴权
 */
async function groupRequired(ctx: RouterContext, next: () => Promise<any>) {
  if (ctx.request.method !== 'OPTIONS') {
    await parseHeader(ctx);
    // @ts-ignore
    const currentUser = ctx.currentUser;
    // 用户处于未激活状态
    checkUserIsActive(currentUser);
    // 超级管理员
    if (currentUser && currentUser.isAdmin) {
      await next();
    } else {
      const groupId = currentUser.group_id;
      if (!groupId) {
        throw new AuthFailed({
          msg: '您还不属于任何权限组，请联系超级管理员获得权限'
        });
      }
      // @ts-ignore
      if (ctx.matched) {
        // @ts-ignore
        const routeName = ctx._matchedRouteName || ctx.routerName;
        const endpoint = `${ctx.method} ${routeName}`;
        const { auth, module } = routeMetaInfo.get(endpoint);
        // @ts-ignore
        const item = await ctx.manager.authModel.findOne({
          where: { auth, module, group_id: groupId }
        });
        // console.log(item);
        if (item) {
          await next();
        } else {
          throw new AuthFailed({ msg: '权限不够，请联系超级管理员获得权限' });
        }
      } else {
        throw new AuthFailed({ msg: '权限不够，请联系超级管理员获得权限' });
      }
    }
  } else {
    await next();
  }
}

/**
 * 守卫函数，非超级管理员不可访问
 */
async function adminRequired(ctx: RouterContext, next: () => Promise<any>) {
  if (ctx.request.method !== 'OPTIONS') {
    await parseHeader(ctx);
    // @ts-ignore
    const currentUser = ctx.currentUser;
    if (currentUser && currentUser.isAdmin) {
      await next();
    } else {
      throw new AuthFailed({ msg: '只有超级管理员可操作' });
    }
  } else {
    await next();
  }
}

export {
  jwt,
  getTokens,
  loginRequired,
  groupRequired,
  adminRequired,
  refreshTokenRequired,
  refreshTokenRequiredWithUnifyException,
  checkUserIsActive
};
