import { Context } from 'koa';
import { HttpException } from '../exception/http-exception';
import { logger } from '../extend';
import { config } from '../config';
/**
 * 全局异常处理中间件
 */
export const error = (err: Error, ctx: Context) => {
  ctx.type = 'application/json';
  if (err instanceof HttpException) {
    ctx.status = err.code || 500;
    ctx.body = JSON.stringify({
      code: err.errorCode,
      message: err.msg,
      request: `${ctx.method} ${ctx.req.url}`
    });
  } else {
    logger.error(err);
    if (config.isDebug()) {
      ctx.body = JSON.stringify(err);
    } else {
      ctx.body = JSON.stringify({
        code: 9999,
        message: '服务器未知错误',
        request: `${ctx.method} ${ctx.req.url}`
      });
    }
  }
};

