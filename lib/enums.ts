//  status for user is super
//  是否为超级管理员的枚举
export enum UserAdmin {
  COMMON = 1,
  ADMIN = 2
}

//  : status for user is active
//  : 当前用户是否为激活状态的枚举
export enum UserActive {
  ACTIVE = 1,
  NOT_ACTIVE = 2
}

/**
 * 令牌的类型
 */
export enum TokenType {
  ACCESS = "access",
  REFRESH = "refresh"
}
