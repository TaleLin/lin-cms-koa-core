/**
 * 枚举
 */

/**
 * 是否为超级管理员的枚举
 * COMMON 代表 普通用户
 * ADMIN 代表 超级管理员
 */
export enum UserAdmin {
  COMMON = 1,
  ADMIN = 2
}

/**
 * 当前用户是否为激活状态的枚举
 * ACTIVE 代表 激活状态
 * NOT_ACTIVE 代表 非激活状态
 */
export enum UserActive {
  ACTIVE = 1,
  NOT_ACTIVE = 2
}

/**
 * 令牌的类型
 * ACCESS 代表 access token
 * REFRESH 代表 refresh token
 */
export enum TokenType {
  ACCESS = "access",
  REFRESH = "refresh"
}
