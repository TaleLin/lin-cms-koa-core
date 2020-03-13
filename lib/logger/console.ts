'use strict';

import { Transport } from 'egg-logger';
const utils = require('egg-logger/lib/utils');
const levels = require('egg-logger/lib/level');

import { consoleFormatter } from './format';

/**
 * output log to console {@link Transport}。
 * specifical level by EGG_LOG has the highest priority
 */
export class ConsoleTransport extends Transport {
  options: any;

  /**
   * @constructor
   * @param {Object} options
   * - {Array} [stderrLevel = ERROR] - output to stderr level, must higher than options.level
   */
  constructor(options) {
    super(options);
    this.options.stderrLevel = utils.normalizeLevel(this.options.stderrLevel);
  }

  get defaults() {
    // @ts-ignore
    return utils.assign(super.defaults, {
      stderrLevel: 'ERROR'
    });
  }

  /**
   * output log, see {@link Transport#log}
   * if stderrLevel presents, will output log to stderr
   * @param  {String} level - log level, in upper case
   * @param  {Array} args - all arguments
   * @param  {Object} meta - meta infomations
   */
  log(level, args, meta) {
    meta = meta || {};
    meta.formatter = consoleFormatter;
    const msg: any = super.log(level, args, meta);
    if (
      levels[level] >= this.options.stderrLevel &&
      levels[level] < levels['NONE']
    ) {
      process.stderr.write(msg);
    } else {
      process.stdout.write(msg);
    }
  }
}
