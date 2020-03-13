import Application from 'koa';
import { config } from '../config';
import { ConsoleTransport, FileTransport } from '../logger';
import { Logger } from 'egg-logger';

// 默认配置
let options = {
  level: 'INFO',
  dir: 'logs',
  sizeLimit: 1024 * 1024 * 5,
  file: true
};
const logConf = config.getItem('log');

// 融合配置
options = { ...options, ...logConf };

export const logger = new Logger({});

// 如果file开启，则打开，否则关闭
if (options.file) {
  logger.set(
    'file',
    // 日志输出到文件
    new FileTransport({
      dir: options.dir,
      sizeLimit: options.sizeLimit,
      level: options.level
    })
  );
}
logger.set(
  'console',
  // 日志输出到终端
  new ConsoleTransport({
    level: options.level
  })
);

/**
 * ATTENTION: 需第一时间主动加载配置，然后将 logging 扩展第一时间挂载到ctx原型上
 * 日志扩展
 *
 * ```js
 * ctx.logger.info();
 * ctx.logger.warn();
 * ctx.logger.debug();
 * ctx.logger.error();
 * ```
 *
 * @param app app实例
 */
export const logging = (app: Application) => {
  app.context.logger = logger;
};
