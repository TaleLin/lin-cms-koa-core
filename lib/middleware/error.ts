import { Context } from 'koa';
import { HttpException } from '../exception/http-exception';
import { CodeMessage } from '../types'
import { logger } from '../extend';
import { config } from '../config';

const CodeMessage = config.getItem('codeMessage', {}) as CodeMessage

/**
 * 全局异常处理中间件
 */
export const error = (err: Error, ctx: Context) => {
  ctx.type = 'application/json';
  if (err instanceof HttpException) {
    ctx.status = err.status || 500;
    ctx.body = JSON.stringify({
      code: err.code,
      message: err.message,
      request: `${ctx.method} ${ctx.req.url}`
    });
  } else {
    logger.error(err);
    if (config.isDebug()) {
      ctx.body = JSON.stringify(err);
    } else {
      ctx.body = JSON.stringify({
        code: 9999,
        message: CodeMessage.getMessage(9999),
        request: `${ctx.method} ${ctx.req.url}`
      });
    }
  }
};

