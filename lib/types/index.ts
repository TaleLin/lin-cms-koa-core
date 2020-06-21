import {IRouterOptions } from 'koa-router'
import { ABSTRACT } from 'sequelize/types'

/**
 * HttpException 类构造函数的参数接口
 */
export interface Exception {
  code?: number;
  message?: any;
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
  permission?: string;
  module?: string;
  mount?: boolean;
}

// LinRouter 选项
export interface LinRouterOptions extends IRouterOptions {
  module?: string;
  mountPermission?: boolean;
}

export interface CodeMessage {
  getMessage: (code: number) => string;
  [propName: number]: string;
}
