import { Request } from 'koa'

/**
 * HttpException 类构造函数的参数接口
 */
export interface Exception {
  code?: number;
  msg?: any;
  errorCode?: number;
}

export interface Option {
  algorithm?: string;
  saltLength?: number;
  iterations?: number;
}

export interface ObjOptions {
  prefix?: string;
  filter?: (key: any) => boolean;
}

// 多文件配置
export interface MulOpts {
  singleLimit?: number;
  totalLimit?: number;
  fileNums?: number;
  include?: string[];
  exclude?: string[];
}
// lin-router 路由元信息
export interface Meta {
  auth?: string;
  module?: string;
  mount?: boolean;
}