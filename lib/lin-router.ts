import Router, { IMiddleware } from 'koa-router';
import { assert } from './util';
import { routeMetaInfo } from './core';

export interface Meta {
  auth?: string;
  module?: string;
  mount?: boolean;
}
/**
 * lin-router继承自koa-router
 * 即可使用全部的koa-router api
 * 也可使用以 lin 为前缀的方法，用于视图函数的权限
 */
export class LinRouter extends Router {
  linOption(
    name: string,
    path: string | RegExp,
    meta?: Meta,
    ...middleware: IMiddleware[]
  ) {
    if (meta && meta.mount) {
      assert(
        !!(meta.auth && meta.module),
        'auth and module must not be empty, if you want to mount'
      );
      const endpoint = 'OPTION ' + name;
      routeMetaInfo.set(endpoint, { auth: meta.auth, module: meta.module });
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
        !!(meta.auth && meta.module),
        'auth and module must not be empty, if you want to mount'
      );
      const endpoint = 'HEAD ' + name;
      routeMetaInfo.set(endpoint, { auth: meta.auth, module: meta.module });
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
        !!(meta.auth && meta.module),
        'auth and module must not be empty, if you want to mount'
      );
      const endpoint = 'GET ' + name;
      routeMetaInfo.set(endpoint, { auth: meta.auth, module: meta.module });
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
        !!(meta.auth && meta.module),
        'auth and module must not be empty, if you want to mount'
      );
      const endpoint = 'PUT ' + name;
      routeMetaInfo.set(endpoint, { auth: meta.auth, module: meta.module });
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
        !!(meta.auth && meta.module),
        'auth and module must not be empty, if you want to mount'
      );
      const endpoint = 'PATCH ' + name;
      routeMetaInfo.set(endpoint, { auth: meta.auth, module: meta.module });
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
        !!(meta.auth && meta.module),
        'auth and module must not be empty, if you want to mount'
      );
      const endpoint = 'POST ' + name;
      routeMetaInfo.set(endpoint, { auth: meta.auth, module: meta.module });
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
        !!(meta.auth && meta.module),
        'auth and module must not be empty, if you want to mount'
      );
      const endpoint = 'DELETE ' + name;
      routeMetaInfo.set(endpoint, { auth: meta.auth, module: meta.module });
    }
    return this.delete(name, path, ...middleware);
  }
}
