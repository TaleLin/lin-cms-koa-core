const Logger = require('egg-logger').Logger;

const { FileTransport } = require('../lin/logger/file');
const { ConsoleTransport } = require('../lin/logger/console');

const logger = new Logger();
logger.set(
  'file',
  new FileTransport({
    dir: 'log',
    sizeLimit: 1024 * 5,
    level: 'DEBUG'
  })
);
logger.set(
  'console',
  new ConsoleTransport({
    level: 'DEBUG'
  })
);

logger.debug('debug foo'); // only output to stdout
logger.info('info foo');

// for (let i = 0; i < 1000; i++) {}

setInterval(() => {
  logger.info('we will never be slavers!!!');
}, 100);

logger.warn('warn foo');
// logger.error(new Error('error foo'));
