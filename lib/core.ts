import Application from 'koa';
import consola from 'consola';
import { Model } from 'sequelize';
import { IMiddleware } from 'koa-router';
import { jwt } from './jwt';
import { assert } from './util';
import { db } from './db';
import {
  UserInterface,
  GroupInterface,
  AuthInterface,
  LogInterface,
  FileInterface
} from './interface';
import { json, logging, success } from './extend';
import { NotFound, ParametersException } from './exception';
import { set, get, has, merge } from 'lodash';
import { Loader } from './loader';
import { LinRouter } from './lin-router';
import { verify } from './password-hash';
import { config } from './config';

// tslint:disable-next-line:variable-name
export const __version__ = '0.0.1';

// 存放meta路由信息
export const routeMetaInfo = new Map();

// 当前文件路由是否挂载
export const disableLoading = Symbol('disableLoading');

/**
 * Lin核心类
 */
export class Lin {
  private manager: Manager | undefined;
  private app: Application | undefined;

  /**
   * 初始化
   *
   * @param app koa app
   * @param mount 是否挂载路由
   * @param synchronize 是否同步模型到数据库
   * @param userModel 用户模型
   * @param groupModel 分组模型
   * @param authModel 权限模型
   */
  public async initApp(
    app: Application,
    mount?: boolean, // 是否挂载插件路由，默认为true
    synchronize?: boolean, // 是否同步模型到数据库
    userModel?: any,
    groupModel?: any,
    authModel?: any
  ) {
    this.app = app;
    assert(!!this.app, 'app must not be null');
    // 2. 默认扩展 json logger
    this.applyDefaultExtends();
    // 3. manager
    userModel = userModel || User;
    groupModel = groupModel || Group;
    authModel = authModel || Auth;
    this.initModels(userModel, groupModel, authModel);
    this.applyManager(userModel, groupModel, authModel);
    // 4. db 同步到数据库默认为false，每次同步会很慢 todo 抽离
    await this.applyDB(synchronize);
    // 5. jwt
    this.applyJwt();
    // 6. 挂载默认路由
    mount && this.mount();
  }

  private applyJwt() {
    const secret = this.app!.context.config.getItem('secret');
    jwt.initApp(this.app!, secret);
  }

  private initModels(userModel: any, groupModel: any, authModel: any) {
    userModel.init(
      {
        ...UserInterface.attributes
      },
      merge(
        {
          sequelize: db,
          tableName: 'lin_user',
          modelName: 'user'
        },
        UserInterface.options
      )
    );

    groupModel.init(
      {
        ...GroupInterface.attributes
      },
      merge(
        {
          sequelize: db,
          tableName: 'lin_group',
          modelName: 'group'
        },
        GroupInterface.options
      )
    );

    authModel.init(
      {
        ...AuthInterface.attributes
      },
      merge(
        {
          sequelize: db,
          tableName: 'lin_auth',
          modelName: 'auth'
        },
        AuthInterface.options
      )
    );
  }

  private async applyDB(synchronize?: boolean, force?: boolean) {
    synchronize && db.sync({ force });
  }

  private applyManager(userModel: any, groupModel: any, authModel: any) {
    const manager = new Manager();
    this.manager = manager;
    const pluginPath = this.app!.context.config.getItem('pluginPath');
    manager.initApp(this.app!, userModel, groupModel, authModel, pluginPath);
  }

  private applyDefaultExtends() {
    json(this.app!);
    logging(this.app!);
    success(this.app!);
  }

  private mount() {
    const pluginRp = new LinRouter({ prefix: '/plugin' });
    Object.values(this.manager!.plugins).forEach(plugin => {
      consola.info(`loading plugin: ${get(plugin, 'name')}`);
      const controllers: any[] = Object.values(get(plugin, 'controllers'));
      if (controllers.length > 1) {
        controllers.forEach(cont => {
          set(
            cont,
            'opts.prefix',
            `/${get(plugin, 'name')}${get(cont, 'opts.prefix')}`
          );
          get(cont, 'stack', []).forEach(ly => {
            if (config.getItem('debug')) {
              consola.info(
                `loading a route: /plugin/${get(plugin, 'name')}${get(
                  ly,
                  'path'
                )}`
              );
            }
            set(ly, 'path', `/${get(plugin, 'name')}${get(ly, 'path')}`);
          });
          pluginRp
            .use(cont.routes() as IMiddleware)
            .use(cont.allowedMethods() as IMiddleware);
        });
      } else {
        controllers.forEach(cont => {
          if (config.getItem('debug')) {
            get(cont, 'stack', []).forEach(ly => {
              consola.info(`loading a route: /plugin${get(ly, 'path')}`);
            });
          }
          pluginRp
            .use(cont.routes() as IMiddleware)
            .use(cont.allowedMethods() as IMiddleware);
        });
      }
    });
    this.app!.use(pluginRp.routes()).use(pluginRp.allowedMethods());
  }
}

/**
 * 管理者
 * 管理插件，数据模型
 */
export class Manager {
  public loader: Loader | undefined;
  public userModel: any;
  public groupModel: any;
  public authModel: any;

  /**
   * 初始化
   * @param app koa app
   * @param userModel 用户模型
   * @param groupModel 分组模型
   * @param authModel 权限模型
   * @param pluginPath 插件路径
   */
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

  /**
   * 获取插件
   */
  public get plugins() {
    return this.loader!.plugins;
  }

  /**
   * 校验密码是否正确
   * @param username 昵称
   * @param password 密码
   */
  public verify(username: string, password: string) {
    return this.userModel.verify(username, password);
  }

  /**
   * 寻找用户
   * @param args 参数
   */
  public findUser(args: {}) {
    return this.userModel.findOne({ where: { ...args } });
  }

  /**
   * 寻找分组
   * @param args 参数
   */
  public findGroup(args: {}) {
    return this.groupModel.findOne({ where: { ...args } });
  }
}

/**
 * 权限系统中的User模型
 */
export class User extends Model {
  public id!: number;
  public username!: string;
  public admin!: number;
  public active!: number;
  public email!: string;
  public avatar!: string;
  // tslint:disable-next-line:variable-name
  public group_id!: number;
  public password!: string;

  // tslint:disable-next-line:variable-name
  public create_time!: Date;
  // tslint:disable-next-line:variable-name
  public update_time!: Date;
  // tslint:disable-next-line:variable-name
  public delete_time!: Date;

  static async verify(username: string, password: string): Promise<User> {
    // tslint:disable-next-line: await-promise
    const user = await this.findOne({ where: { username, delete_time: null } });
    if (!user) {
      throw new NotFound({ msg: '用户不存在' });
    }
    if (!user.checkPassword(password)) {
      throw new ParametersException({ msg: '密码错误，请输入正确密码' });
    }
    return user;
  }

  checkPassword(raw: string) {
    if (!this.password || this.password === '') {
      return false;
    }
    return verify(raw, this.password);
  }

  resetPassword(newPassword: string) {
    this.password = newPassword;
  }

  changePassword(oldPassword: string, newPassword: string) {
    if (this.checkPassword(oldPassword)) {
      this.password = newPassword;
      return true;
    }
    return false;
  }

  toJSON() {
    const origin = {
      id: this.id,
      username: this.username,
      admin: this.admin,
      active: this.active,
      email: this.email,
      avatar: this.avatar,
      group_id: this.group_id,
      // @ts-ignore
      create_time: this.createTime,
      // @ts-ignore
      update_time: this.updateTime
    };
    if (has(this, 'auths')) {
      return { ...origin, auths: get(this, 'auths', []) };
    } else if (has(this, 'groupName')) {
      return { ...origin, group_name: get(this, 'groupName', '') };
    } else {
      return origin;
    }
  }
}

/**
 * 权限系统中的Group模型
 */
export class Group extends Model {
  public id!: number;
  public name!: string;
  public info!: string;

  toJSON() {
    let origin = {
      id: this.id,
      name: this.name,
      info: this.info
    };
    return has(this, 'auths')
      ? { ...origin, auths: get(this, 'auths', []) }
      : origin;
  }
}

/**
 * 权限系统中的Auth模型
 */
export class Auth extends Model {
  public id!: number;
  // tslint:disable-next-line:variable-name
  public group_id!: number;
  public auth!: string;
  public module!: string;

  toJSON() {
    return {
      id: this.id,
      group_id: this.group_id,
      module: this.module,
      auth: this.auth
    };
  }
}

export interface LogArgs {
  message?: string;
  user_id?: number;
  user_name?: string;
  status_code?: number;
  method?: string;
  path?: string;
  authority?: string;
}

/**
 * 日志模型
 */
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

  static createLog(args?: LogArgs, commit?: boolean) {
    const log = Log.build(args as any);
    commit && log.save();
    return log;
  }

  toJSON() {
    let origin = {
      id: this.id,
      message: this.message,
      time: this.time,
      user_id: this.user_id,
      user_name: this.user_name,
      status_code: this.status_code,
      method: this.method,
      path: this.path,
      authority: this.authority
    };
    return origin;
  }
}

Log.init(
  {
    ...LogInterface.attributes
  },
  merge(
    {
      sequelize: db,
      tableName: 'lin_log',
      modelName: 'log'
    },
    LogInterface.options
  )
);

export interface FileArgs {
  path?: string;
  type?: number;
  name?: string;
  extension?: string;
  size?: number;
  md5?: string;
}

/**
 * 文件模型
 * id,path,type,name,extension,size
 */
export class File extends Model {
  public id!: number;
  public path!: string;
  public type!: number; // 1 => local
  public name!: string;
  public extension!: string;
  public size!: number;
  public md5!: string;

  static async createRecord(args?: FileArgs, commit?: boolean) {
    const record = File.build(args as any);
    // tslint:disable-next-line: await-promise
    commit && (await record.save());
    return record;
  }

  toJSON() {
    let origin = {
      id: this.id,
      path: this.path,
      type: this.type,
      name: this.name,
      extension: this.extension,
      size: this.size,
      md5: this.md5
    };
    return origin;
  }
}

File.init(
  {
    ...FileInterface
  },
  {
    sequelize: db,
    tableName: 'lin_file',
    modelName: 'file',
    createdAt: false,
    updatedAt: false,
    deletedAt: false
  }
);
