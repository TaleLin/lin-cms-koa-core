
import { HttpException, NotFound, MethodNotAllowed } from '../exception/http-exception';
import { Context } from 'koa';
import { config } from '../config';
const levels = require('egg-logger/lib/level');

/* TODO: 分离logger方法 */
/**
 * 全局日志记录，且判断状态码，发出相应的异常 
 * @description 目前使用该中间件前需要先把logger方法挂载到ctx上
 */
export const log = async (ctx: Context, next: () => Promise<any>) => {
  const start = Date.now();
  try {
    await next();
    const ms = Date.now() - start;
    ctx.set('X-Response-Time', `${ms}ms`);
    const requestLog: boolean = config.getItem('log.requestLog', true);
    const level: string = config.getItem('log.level', 'INFO');
    if (requestLog) {
      if (levels[level] <= levels['DEBUG']) {
        const data = {
          param: ctx.request.query,
          body: ctx.request['body']
        };
        ctx.logger.debug(
          `[${ctx.method}] -> [${ctx.url}] from: ${
            ctx.ip
          } costs: ${ms}ms data:${JSON.stringify(data, null, 4)}`
        );
      } else {
        ctx.logger.info(
          `[${ctx.method}] -> [${ctx.url}] from: ${ctx.ip} costs: ${ms}ms`
        );
      }
    }
    if (ctx.status === 404) {
      ctx.app.emit('error', new NotFound(), ctx);
    } else if (ctx.status === 405) {
      ctx.app.emit('error', new MethodNotAllowed(), ctx);
    } else if (!ctx.body) {
      ctx.app.emit('error', new HttpException({ message: ctx.message }), ctx);
    }
  } catch (err) {
    const ms = Date.now() - start;
    const requestLog: boolean = config.getItem('log.requestLog', true);
    const level: string = config.getItem('log.level', 'INFO');
    if (requestLog) {
      if (levels[level] <= levels['DEBUG']) {
        const data = {
          param: ctx.request.query,
          body: ctx.request['body']
        };
        ctx.logger.debug(
          `[${ctx.method}] -> [${ctx.url}] from: ${
            ctx.ip
          } costs: ${ms}ms data:${JSON.stringify(data, null, 4)}`
        );
      } else {
        ctx.logger.info(
          `[${ctx.method}] -> [${ctx.url}] from: ${ctx.ip} costs: ${ms}ms`
        );
      }
    }
    ctx.status = ctx.status || 500;
    ctx.app.emit('error', err, ctx);
  }
};