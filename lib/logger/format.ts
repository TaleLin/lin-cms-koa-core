'use strict';

const chalk = require('chalk');
const os = require('os');

// other variables
const hostname = os.hostname();
const durationRegexp = /([0-9]+ms)/g;
// eslint-disable-next-line no-useless-escape
const categoryRegexp = /(\[[\w\-_.:]+\])/g;
const httpMethodRegexp = /(GET|POST|PUT|PATH|HEAD|DELETE) /g;

// output to Terminal format
export function consoleFormatter(meta) {
  let message =
    meta.date +
    ' ' +
    meta.level +
    ' ' +
    meta.pid +
    ' ' +
    ' --- ' +
    `[${hostname}]` +
    ' - ' +
    meta.message;
  if (!chalk.supportsColor) {
    return message;
  }

  if (meta.level === 'ERROR') {
    return chalk.red(message);
  } else if (meta.level === 'WARN') {
    return chalk.yellow(message);
  }

  // message = message.replace(durationRegexp, chalk.green('$1'));
  // message = message.replace(categoryRegexp, chalk.blue('$1'));
  // message = message.replace(httpMethodRegexp, chalk.cyan('$1 '));
  return message;
}
