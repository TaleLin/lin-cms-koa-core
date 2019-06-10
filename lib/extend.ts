import Application from 'koa';
import {
  HttpException,
  Success,
  Exception,
  FileTooLargeException,
  FileExtensionException,
  FileTooManyException
} from './exception';
import consola from 'consola';
import { toLine, unsets } from './util';
import { config } from './config';
import { get, set, cloneDeep } from 'lodash';
import parse from 'co-busboy';
import sendToWormhole from 'stream-wormhole';
import { extname } from 'path';

import { Logger, FileTransport, ConsoleTransport } from 'egg-logger';

// const Logger = require('egg-logger').Logger;
// const FileTransport = require('egg-logger').FileTransport;
// const ConsoleTransport = require('egg-logger').ConsoleTransport;

/**
 * json序列化扩展
 *
 * ```js
 * ctx.json({ msg:"hello from lin!" })
 * ```
 *
 * @param app app实例
 */
export const json = (app: Application) => {
  /**
   * hide 表示想要隐藏的属性
   */
  app.context.json = function(obj: any, hide = []) {
    this.type = 'application/json';
    unsets(obj, hide);
    let data = Object.create(null);
    if (obj instanceof HttpException) {
      transform(obj, data);
      set(data, 'url', this.request.url);
      this.status = obj.code;
    } else {
      data = obj;
    }
    this.body = JSON.stringify(data);
  };
};

function transform(obj: any, data: any) {
  const fields: string[] = get(obj, 'fields', []);
  fields.forEach(field => {
    data[toLine(field)] = get(obj, field);
  });
}

/**
 * 处理success
 *
 * ```js
 * ctx.success({ msg:"hello from lin!" })
 * ```
 *
 * ```js
 * ctx.success({ code: 200, msg: "hello from lin!", errorCode: 10000 })
 * ```
 *
 * @param app app实例
 */
export const success = (app: Application) => {
  app.context.success = function(ex?: Exception) {
    this.type = 'application/json';
    const suc = new Success(ex);
    let data = {
      error_code: suc.errorCode,
      msg: suc.msg,
      url: this.req.url
    };
    this.status = suc.code;
    this.body = JSON.stringify(data);
  };
};

/**
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
  // TODO: 提供配置项
  // const logger = new Logger();
  // logger.set(
  //   'file',
  //   new FileTransport({
  //     file: '/path/to/file',
  //     level: 'INFO'
  //   })
  // );
  // logger.set(
  //   'console',
  //   new ConsoleTransport({
  //     level: 'DEBUG'
  //   })
  // );
  app.context.logger = consola;
};

export interface MulOpts {
  autoFields?: boolean;
  singleLimit?: number;
  totalLimit?: number;
  fileNums?: number;
  include?: string[];
  exclude?: string[];
}

/**
 * 解析上传文件
 * @param app app实例
 */
export const multipart = (app: Application) => {
  app.context.multipart = async function(opts?: MulOpts) {
    // multipart/form-data
    if (!this.is('multipart')) {
      throw new Error('Content-Type must be multipart/*');
    }
    // field指表单中的非文件
    const parts = parse(this, { autoFields: opts && opts.autoFields });
    let part;
    let totalSize = 0;
    const files: any[] = [];
    // tslint:disable-next-line:no-conditional-assignment
    while ((part = await parts()) != null) {
      if (part.length) {
        // arrays are busboy fields
      } else {
        if (!part.filename) {
          // user click `upload` before choose a file,
          // `part` will be file stream, but `part.filename` is empty
          // must handler this, such as log error.
          await sendToWormhole(part);
          continue;
        }
        // otherwise, it's a stream
        // part.fieldname, part.filename, part.encoding, part.mime
        // _readableState.length
        // part.readableLength 31492 检查单个文件的大小
        // 超过长度，报错
        // 检查extension，报错
        const ext = extname(part.filename);
        if (
          !checkFileExtension(ext, opts && opts.include, opts && opts.exclude)
        ) {
          throw new FileExtensionException({ msg: `不支持类型为${ext}的文件` });
        }
        const { valid, conf } = checkSingleFileSize(
          part._readableState.length,
          opts && opts.singleLimit
        );
        if (!valid) {
          throw new FileTooLargeException({
            msg: `文件单个大小不能超过${conf}b`
          });
        }
        // 计算总大小
        totalSize += part._readableState.length;
        const tmp = cloneDeep(part);
        files.push(tmp);
        // 恢复再次接受data
        part.resume();
      }
    }
    const { valid, conf } = checkFileNums(files.length, opts && opts.fileNums);
    if (!valid) {
      throw new FileTooManyException({ msg: `上传文件数量不能超过${conf}` });
    }
    const { valid: valid1, conf: conf1 } = checkTotalFileSize(
      totalSize,
      opts && opts.totalLimit
    );
    if (!valid1) {
      throw new FileTooLargeException({ msg: `总文件体积不能超过${conf1}` });
    }
    return files;
  };
};

function checkSingleFileSize(size: number, singleLimit?: number) {
  // file_include,file_exclude,file_single_limit,file_total_limit,file_store_dir
  // 默认 2M
  const confSize = singleLimit
    ? singleLimit
    : config.getItem('file.singleLimit', 1024 * 1024 * 2);
  return {
    valid: confSize > size,
    conf: confSize
  };
}

function checkTotalFileSize(size: number, totalLimit?: number) {
  // 默认 20M
  const confSize = totalLimit
    ? totalLimit
    : config.getItem('file.totalLimit', 1024 * 1024 * 20);
  return {
    valid: confSize > size,
    conf: confSize
  };
}

function checkFileNums(nums: number, fileNums?: number) {
  // 默认 10
  const confNums = fileNums ? fileNums : config.getItem('file.nums', 10);
  return {
    valid: confNums > nums,
    conf: confNums
  };
}

function checkFileExtension(
  ext: string,
  include?: string[],
  exclude?: string[]
) {
  const fileInclude = include ? include : config.getItem('file.include');
  const fileExclude = exclude ? exclude : config.getItem('file.exclude');
  // 如果两者都有取fileInclude，有一者则用一者
  if (fileInclude && fileExclude) {
    if (!Array.isArray(fileInclude)) {
      throw new Error('file_include must an array!');
    }
    return fileInclude.includes(ext);
  } else if (fileInclude && !fileExclude) {
    // 有include，无exclude
    if (!Array.isArray(fileInclude)) {
      throw new Error('file_include must an array!');
    }
    return fileInclude.includes(ext);
  } else if (fileExclude && !fileInclude) {
    // 有exclude，无include
    if (!Array.isArray(fileExclude)) {
      throw new Error('file_exclude must an array!');
    }
    return !fileExclude.includes(ext);
  } else {
    // 二者都没有
    return true;
  }
}
