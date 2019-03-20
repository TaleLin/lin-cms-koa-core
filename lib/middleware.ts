import { HttpException, NotFound, MethodNotAllowed } from "./exception";
import { Context } from "koa";

/**
 * 全局异常处理中间件
 */
export const error = (err: Error, ctx: Context) => {
  ctx.type = "application/json";
  if (err instanceof HttpException) {
    ctx.status = err.code || 500;
    ctx.body = JSON.stringify({
      error_code: err.errorCode,
      msg: err.msg,
      url: ctx.req.url
    });
  } else {
    ctx.logger.error(err as any);
    ctx.body = JSON.stringify({
      error_code: 999,
      msg: "服务器未知错误",
      url: ctx.req.url
    });
  }
};

/**
 * 全局日志记录，且判断状态码，发出相应的异常
 */
export const log = async (ctx: Context, next: () => Promise<any>) => {
  const start = Date.now();
  try {
    await next();
    const ms = Date.now() - start;
    ctx.set("X-Response-Time", `${ms}ms`);
    ctx.logger.info(
      `[${ctx.method}] -> [${ctx.url}] from: ${ctx.ip} costs: ${ms}ms`
    );

    if (ctx.status === 404) {
      ctx.app.emit("error", new NotFound(), ctx);
    } else if (ctx.status === 405) {
      ctx.app.emit("error", new MethodNotAllowed(), ctx);
    } else if (!ctx.body) {
      ctx.app.emit("error", new HttpException({ msg: ctx.message }), ctx);
    }
  } catch (err) {
    ctx.status = ctx.status || 500;
    ctx.app.emit("error", err, ctx);
  }
};
