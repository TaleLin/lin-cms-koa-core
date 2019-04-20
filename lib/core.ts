import Application from "koa";
import consola from "consola";
import { Model } from "sequelize";
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
import { LinRouter } from "./lin-router";
import { verify } from "./password-hash";
import dayjs from "dayjs";
import { config } from "./config";

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
            if (config.getItem("debug")) {
              consola.info(
                `loading a route: /plugin/${get(plugin, "name")}${get(
                  ly,
                  "path"
                )}`
              );
            }
            set(ly, "path", `/${get(plugin, "name")}${get(ly, "path")}`);
          });
          pluginRp
            .use((cont as any).routes() as IMiddleware)
            .use((cont as any).allowedMethods() as IMiddleware);
        });
      } else {
        controllers.forEach(cont => {
          if (config.getItem("debug")) {
            get(cont, "stack", []).forEach(ly => {
              consola.info(`loading a route: /plugin${get(ly, "path")}`);
            });
          }
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
export class User extends Model {
  public id!: number;
  public nickname!: string;
  public admin!: number;
  public active!: number;
  public email!: string;
  // tslint:disable-next-line:variable-name
  public group_id!: number;
  public password!: string;

  // tslint:disable-next-line:variable-name
  public create_time!: Date;
  // tslint:disable-next-line:variable-name
  public update_time!: Date;
  // tslint:disable-next-line:variable-name
  public delete_time!: Date;
}

User.init(
  {
    ...UserInterface.attributes
  },
  merge(
    {
      sequelize: db,
      tableName: "lin_user",
      modelName: "user"
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
  // @ts-ignore
  if (!this.password || this.password === "") {
    return false;
  }
  // @ts-ignore
  return verify(raw, this.password);
};

// @ts-ignore
// User.prototype.softDelete = function() {
//   this.delete_time = new Date();
//   this.save();
// };

// @ts-ignore
User.prototype.toJSON = function() {
  const origin = {
    // @ts-ignore
    id: this.id,
    // @ts-ignore
    nickname: this.nickname,
    // @ts-ignore
    admin: this.admin,
    // @ts-ignore
    active: this.active,
    // @ts-ignore
    email: this.email,
    // @ts-ignore
    group_id: this.groupId,
    // @ts-ignore
    create_time: this.createTime
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
  // @ts-ignore
  this.password = newPassword;
};

// @ts-ignore
User.prototype.changePassword = function(
  oldPassword: string,
  newPassword: string
) {
  // @ts-ignore
  if (this.checkPassword(oldPassword)) {
    // @ts-ignore
    this.password = newPassword;
    return true;
  }
  return false;
};

/**
 * 权限系统中的Group模型
 */
export class Group extends Model {
  public id!: number;
  public name!: string;
  public info!: string;
}

Group.init(
  {
    ...GroupInterface.attributes
  },
  merge(
    {
      sequelize: db,
      tableName: "lin_group",
      modelName: "group"
    },
    GroupInterface.options
  )
);

// @ts-ignore
Group.prototype.toJSON = function() {
  let origin = {
    // @ts-ignore
    id: this.id,
    // @ts-ignore
    name: this.name,
    // @ts-ignore
    info: this.info
  };
  return has(this, "auths")
    ? { ...origin, auths: get(this, "auths", []) }
    : origin;
};

/**
 * 权限系统中的Auth模型
 */
export class Auth extends Model {
  public id!: number;
  // tslint:disable-next-line:variable-name
  public group_id!: number;
  public auth!: string;
  public module!: string;
}

Auth.init(
  {
    ...AuthInterface.attributes
  },
  merge(
    {
      sequelize: db,
      tableName: "lin_auth",
      modelName: "auth"
    },
    AuthInterface.options
  )
);

// @ts-ignore
Auth.prototype.toJSON = function() {
  return {
    // @ts-ignore
    id: this.id,
    // @ts-ignore
    group_id: this.group_id,
    // @ts-ignore
    module: this.module,
    // @ts-ignore
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

export class Log extends Model {
  public id!: number;
  public message!: string;
  // tslint:disable-next-line:variable-name
  public user_id!: number;
  // tslint:disable-next-line:variable-name
  public user_name!: string;
  // tslint:disable-next-line:variable-name
  public status_code!: number;
  public method!: string;
  public path!: string;
  public authority!: string;
  public time!: Date;
}

Log.init(
  {
    ...LogInterface.attributes
  },
  merge(
    {
      sequelize: db,
      tableName: "lin_log",
      modelName: "log"
    },
    LogInterface.options
  )
);

// @ts-ignore
Log.createLog = function(args?: LogArgs, commit?: boolean) {
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
    time: this.time ? null : dayjs(this.time).unix(),
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
