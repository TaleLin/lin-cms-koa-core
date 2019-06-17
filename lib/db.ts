import { Sequelize } from 'sequelize';
import { config } from './config';

/**
 * 数据库配置项
 */

/**
 * 数据库名，默认lin-cms
 */
const database = config.getItem('db.database', 'lin-cms');

/**
 * 数据库用户名，默认root
 */
const username = config.getItem('db.username', 'root');

/**
 * 数据库密码，默认123456
 */
const password = config.getItem('db.password', '123456');

/**
 * 其它数据库配置项
 */
const options = config.getItem('db', {});

/**
 * 全局的 Sequelize 实例
 */
export const db = new Sequelize(database, username, password, {
  ...options
});

/**
 * 数据库类型，默认mysql, dialect
 */
// const type = config.getItem('db.type', 'mysql');

/**
 * 数据库host，默认localhost
 */
// const host = config.getItem('db.host', 'localhost');

/**
 * 数据库端口，默认3306
 */
// const port = config.getItem('db.port', 3306);

/**
 * 是否输出sequelize日志，默认 true
 */
// const logging = config.getItem('db.logging', true);
