import Application from "koa";
import consola from "consola";
import { IMiddleware } from "koa-router";
import { jwt } from "./jwt";
import { assert } from "./util";
import { db } from "./db";
import {
  UserInterface,
  GroupInterface,
  AuthInterface,
  LogInterface
} from "./interface";
import { json, logging } from "./extend";
import { NotFound, ParametersException } from "./exception";
import { set, get, has, merge } from "lodash";
import { Loader } from "./loader";
import { LinRouter } from "./linRouter";
import { verify } from "./passwordHash";

// tslint:disable-next-line:variable-name
export const __version__ = "0.0.1";

// 存放meta路由信息
export const routeMetaInfo = new Map();

// 当前文件路由是否挂载
export const disableLoading = Symbol("disableLoading");

// 初始化各种扩展，中间件
export class Lin {
  private manager: Manager | undefined;
  private app: Application | undefined;

  public async initApp(
    app: Application,
    mount?: boolean, // 是否挂载插件路由，默认为true
    synchronize?: boolean, // 是否同步模型到数据库
    userModel?: any,
    groupModel?: any,
    authModel?: any
  ) {
    this.app = app;
    assert(!!this.app, "app must not be null");
    // 2. 默认扩展 json logger
    this.applyDefaultExtends();
    // 3. manager
    userModel = userModel || User;
    groupModel = groupModel || Group;
    authModel = authModel || Auth;
    this.applyManager(userModel, groupModel, authModel);
    // 4. db 同步到数据库默认为false，每次同步会很慢 todo 抽离
    await this.applyDB(synchronize);
    // 5. jwt
    this.applyJwt();
    // 6. 挂载默认路由
    mount && this.mount();
  }

  private applyJwt() {
    const secret = this.app!.context.config.getItem("secret");
    jwt.initApp(this.app!, secret);
  }

  private async applyDB(synchronize?: boolean, force?: boolean) {
    synchronize && db.sync({ force });
  }

  private applyManager(userModel: any, groupModel: any, authModel: any) {
    const manager = new Manager();
    this.manager = manager;
    const pluginPath = this.app!.context.config.getItem("pluginPath");
    manager.initApp(this.app!, userModel, groupModel, authModel, pluginPath);
  }

  private applyDefaultExtends() {
    json(this.app!);
    logging(this.app!);
  }

  private mount() {
    const pluginRp = new LinRouter({ prefix: "/plugin" });
    Object.values(this.manager!.plugins).forEach(plugin => {
      consola.info(`loading plugin: ${get(plugin, "name")}`);
      const controllers = Object.values(get(plugin, "controllers"));
      if (controllers.length > 1) {
        controllers.forEach(cont => {
          set(
            cont,
            "opts.prefix",
            `/${get(plugin, "name")}${get(cont, "opts.prefix")}`
          );
          get(cont, "stack", []).forEach(ly => {
            consola.info(
              `loading a route: /plugin/${get(plugin, "name")}${get(
                ly,
                "path"
              )}`
            );
            set(ly, "path", `/${get(plugin, "name")}${get(ly, "path")}`);
          });
          // cont.stack[0].path
          pluginRp
            .use((cont as any).routes() as IMiddleware)
            .use((cont as any).allowedMethods() as IMiddleware);
        });
      } else {
        controllers.forEach(cont => {
          get(cont, "stack", []).forEach(ly => {
            consola.info(`loading a route: /plugin/${get(ly, "path")}`);
          });
          pluginRp
            .use((cont as any).routes() as IMiddleware)
            .use((cont as any).allowedMethods() as IMiddleware);
        });
      }
    });
    this.app!.use(pluginRp.routes()).use(pluginRp.allowedMethods());
  }
}

// 管理插件，数据模型
export class Manager {
  public loader: Loader | undefined;
  public userModel: any;
  public groupModel: any;
  public authModel: any;

  public initApp(
    app: Application,
    userModel: any,
    groupModel: any,
    authModel: any,
    pluginPath: {}
  ) {
    app.context.manager = this;
    this.userModel = userModel;
    this.groupModel = groupModel;
    this.authModel = authModel;
    this.loader = new Loader(pluginPath, app);
  }

  public get plugins() {
    return this.loader!.plugins;
  }

  public verify(nickname: string, password: string) {
    return this.userModel.verify(nickname, password);
  }

  public findUser(args: {}) {
    return this.userModel.findOne({ where: { ...args } });
  }

  public findGroup(args: {}) {
    return this.groupModel.findOne({ where: { ...args } });
  }
}

/**
 * 权限系统中的User模型
 */
export const User = db.define(
  "lin_user",
  {
    ...UserInterface.attributes
  },
  merge(
    {
      tableName: "lin_user"
    },
    UserInterface.options
  )
);

// @ts-ignore
User.verify = async function(nickname: string, password: string) {
  // @ts-ignore
  // tslint:disable-next-line: await-promise
  const user = await this.findOne({ where: { nickname } });
  if (!user) {
    throw new NotFound({ msg: "用户不存在" });
  }
  // @ts-ignore
  if (!user.checkPassword(password)) {
    throw new ParametersException({ msg: "密码错误，请输入正确密码" });
  }
  return user;
};

// @ts-ignore
User.prototype.checkPassword = function(raw: string) {
  if (!this.password || this.password === "") {
    return false;
  }
  return verify(raw, this.password);
};

// @ts-ignore
User.prototype.softDelete = function() {
  this.delete_time = new Date();
  this.save();
};

// @ts-ignore
User.prototype.toJSON = function() {
  const origin = {
    id: this.id,
    nickname: this.nickname,
    admin: this.admin,
    active: this.active,
    email: this.email,
    group_id: this.groupId,
    create_time: this.create_time
  };
  if (has(this, "auths")) {
    return { ...origin, auths: get(this, "auths", []) };
  } else if (has(this, "groupName")) {
    return { ...origin, group_name: get(this, "groupName", "") };
  } else {
    return origin;
  }
};

// @ts-ignore
User.prototype.resetPassword = function(newPassword: string) {
  // 注意，重置密码后记得提交至数据库
  this.password = newPassword;
};

// @ts-ignore
User.prototype.changePassword = function(
  oldPassword: string,
  newPassword: string
) {
  if (this.checkPassword(oldPassword)) {
    this.password = newPassword;
    return true;
  }
  return false;
};

/**
 * 权限系统中的Group模型
 */
export const Group = db.define(
  "lin_group",
  { ...GroupInterface.attributes },
  merge(
    {
      tableName: "lin_group"
    },
    GroupInterface.options
  )
);

// @ts-ignore
Group.prototype.toJSON = function() {
  let origin = {
    id: this.id,
    name: this.name,
    info: this.info
  };
  return has(this, "auths")
    ? { ...origin, auths: get(this, "auths", []) }
    : origin;
};

/**
 * 权限系统中的Auth模型
 */
export const Auth = db.define(
  "lin_auth",
  {
    ...AuthInterface.attributes
  },
  merge(
    {
      tableName: "lin_auth"
    },
    AuthInterface.options
  )
);

// @ts-ignore
Auth.prototype.toJSON = function() {
  return {
    id: this.id,
    group_id: this.group_id,
    module: this.module,
    auth: this.auth
  };
};

export interface LogArgs {
  message?: string;
  user_id?: number;
  user_name?: string;
  status_code?: number;
  method?: string;
  path?: string;
  authority?: string;
}

export const Log = db.define(
  "lin_log",
  {
    ...LogInterface.attributes
  },
  merge(
    {
      tableName: "lin_log"
    },
    LogInterface.options
  )
);

// @ts-ignore
Log.createLog = function(args?: LogArgs, commit?: boolean) {
  // if (args) {
  //   Object.keys(args).forEach(arg => {
  //     set(log, arg, get(args, arg));
  //   });
  // }
  const log = Log.build(args as any);
  // @ts-ignore
  commit && log.save();
  return log;
};

// @ts-ignore
Log.prototype.toJSON = function() {
  let origin = {
    // @ts-ignore
    id: this.id,
    // @ts-ignore
    message: this.message,
    // @ts-ignore
    time: this.time,
    // @ts-ignore
    user_id: this.user_id,
    // @ts-ignore
    user_name: this.user_name,
    // @ts-ignore
    status_code: this.status_code,
    // @ts-ignore
    method: this.method,
    // @ts-ignore
    path: this.path,
    // @ts-ignore
    authority: this.authority
  };
  return origin;
};
