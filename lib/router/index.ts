import  Router, {IRouterOptions,IMiddleware } from 'koa-router'
import { assert, isFunction } from '../utils';
import { Meta } from '../types'

export const routeMetaInfo = new Map()
/**
 * lin-router继承自koa-router
 * 即可使用全部的koa-router api
 * 也可使用以 lin 为前缀的方法，用于视图函数的权限
 */
export class LinRouter extends Router {
  constructor(linRouterOptions?: IRouterOptions){
    super(linRouterOptions)
  }

  linOption(
    name: string,
    path: string | RegExp,
    meta?: Meta,
    ...middleware: IMiddleware[]
  ) {
    if (meta && meta.mount) {
      assert(
        !!(meta.permission && meta.module),
        'permission and module must not be empty, if you want to mount'
      );
      const endpoint = 'OPTION ' + name;
      routeMetaInfo.set(endpoint, { permission: meta.permission, module: meta.module });
    }
    if (isFunction(meta)) {
      return this.get(name, path, meta as IMiddleware, ...middleware)
    }
    return this.options(name, path, ...middleware);
  }

  linHead(
    name: string,
    path: string | RegExp,
    meta?: Meta,
    ...middleware: IMiddleware[]
  ) {
    if (meta && meta.mount) {
      assert(
        !!(meta.permission && meta.module),
        'permission and module must not be empty, if you want to mount'
      );
      const endpoint = 'HEAD ' + name;
      routeMetaInfo.set(endpoint, { permission: meta.permission, module: meta.module });
    }
    if (isFunction(meta)) {
      return this.get(name, path, meta as IMiddleware, ...middleware)
    }
    return this.head(name, path, ...middleware);
  }

  linGet(
    name: string,
    path: string | RegExp,
    meta?: Meta,
    ...middleware: IMiddleware[]
  ) {
    if (meta && meta.mount) {
      assert(
        !!(meta.permission && meta.module),
        'permission and module must not be empty, if you want to mount'
      );
      const endpoint = 'GET ' + name;
      routeMetaInfo.set(endpoint, { permission: meta.permission, module: meta.module });
    }
    if (isFunction(meta)) {
      return this.get(name, path, meta as IMiddleware, ...middleware)
    }
    return this.get(name, path, ...middleware);
  }

  linPut(
    name: string,
    path: string | RegExp,
    meta?: Meta,
    ...middleware: IMiddleware[]
  ) {
    if (meta && meta.mount) {
      assert(
        !!(meta.permission && meta.module),
        'permission and module must not be empty, if you want to mount'
      );
      const endpoint = 'PUT ' + name;
      routeMetaInfo.set(endpoint, { permission: meta.permission, module: meta.module });
    }
    if (isFunction(meta)) {
      return this.get(name, path, meta as IMiddleware, ...middleware)
    }
    return this.put(name, path, ...middleware);
  }

  linPatch(
    name: string,
    path: string | RegExp,
    meta?: Meta,
    ...middleware: IMiddleware[]
  ) {
    if (meta && meta.mount) {
      assert(
        !!(meta.permission && meta.module),
        'permission and module must not be empty, if you want to mount'
      );
      const endpoint = 'PATCH ' + name;
      routeMetaInfo.set(endpoint, { permission: meta.permission, module: meta.module });
    }
    if (isFunction(meta)) {
      return this.get(name, path, meta as IMiddleware, ...middleware)
    }
    return this.patch(name, path, ...middleware);
  }

  linPost(
    name: string,
    path: string | RegExp,
    meta?: Meta,
    ...middleware: IMiddleware[]
  ) {
    if (meta && meta.mount) {
      assert(
        !!(meta.permission && meta.module),
        'permission and module must not be empty, if you want to mount'
      );
      const endpoint = 'POST ' + name;
      routeMetaInfo.set(endpoint, { permission: meta.permission, module: meta.module });
    }
    if (isFunction(meta)) {
      return this.get(name, path, meta as IMiddleware, ...middleware)
    }
    return this.post(name, path, ...middleware);
  }

  linDelete(
    name: string,
    path: string | RegExp,
    meta?: Meta,
    ...middleware: IMiddleware[]
  ) {
    if (meta && meta.mount) {
      assert(
        !!(meta.permission && meta.module),
        'permission and module must not be empty, if you want to mount'
      );
      const endpoint = 'DELETE ' + name;
      routeMetaInfo.set(endpoint, { permission: meta.permission, module: meta.module });
    }
    if (isFunction(meta)) {
      return this.get(name, path, meta as IMiddleware, ...middleware)
    }
    return this.delete(name, path, ...middleware);
  }
}
