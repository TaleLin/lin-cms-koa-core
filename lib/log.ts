import { IRouterContext } from "koa-router";
import { assert, findAuthAndModule } from "./util";
import { get } from "lodash";
import { Response, Request } from "koa";
import { Log } from "./core";

const REG_XP = /(?<=\{)[^}]*(?=\})/g;

export const logger = (template: string) => {
  return async (ctx: IRouterContext, next: () => Promise<any>) => {
    await next();
    // 取数据，写入到日志中
    writeLog(template, ctx);
  };
};

function writeLog(template: string, ctx: IRouterContext) {
  const message = parseTemplate(
    template,
    ctx.currentUser,
    ctx.response,
    ctx.request
  );
  if (ctx.matched) {
    const info = findAuthAndModule(ctx);
    let auth = "";
    if (info) {
      auth = get(info, "auth");
    }
    const statusCode = ctx.status || 0;
    // @ts-ignore
    Log.createLog(
      {
        message: message,
        user_id: ctx.currentUser.id,
        user_name: ctx.currentUser.nickname,
        status_code: statusCode,
        method: ctx.request.method,
        path: ctx.request.path,
        authority: auth
      },
      true
    );
  }
}

export function parseTemplate(
  template: string,
  user,
  reponse: Response,
  request: Request
) {
  const res = REG_XP.exec(template);
  if (res) {
    res.forEach(item => {
      const index = item.lastIndexOf(".");
      assert(index !== -1, item + "中必须包含 . ,且为一个");
      const obj = item.substring(0, index);
      const prop = item.substring(index + 1, item.length);
      let it;
      switch (obj) {
        case "user":
          it = get(user, prop, "");
          break;
        case "response":
          it = get(reponse, prop, "");
          break;
        case "request":
          it = get(request, prop, "");
          break;
        default:
          it = "";
          break;
      }
      template = template.replace(`{${item}}`, it);
    });
  }
  return template;
}
