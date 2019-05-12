import Application from 'koa';
import {
  HttpException,
  Success,
  Exception,
  FileTooLargeException
} from './exception';
import consola from 'consola';
import { toLine, unsets } from './util';
import { config } from './config';
import { get, set, cloneDeep } from 'lodash';
import parse from 'co-busboy';
import sendToWormhole from 'stream-wormhole';
import { extname } from 'path';

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
  app.context.logger = consola;
};

/**
 * 解析上传文件
 * @param app app实例
 */
export const multipart = (app: Application) => {
  app.context.multipart = async function(autoFields = false) {
    // multipart/form-data
    if (!this.is('multipart')) {
      throw new Error('Content-Type must be multipart/*');
    }
    // field指表单中的非文件
    const parts = parse(this, { autoFields: autoFields });
    let part;
    let totalSize = 0;
    const files: any[] = [];
    // tslint:disable-next-line:no-conditional-assignment
    while ((part = await parts()) != null) {
      if (part.length) {
        // arrays are busboy fields
        // console.log('field: ' + part[0]);
        // console.log('value: ' + part[1]);
        // console.log('valueTruncated: ' + part[2]);
        // console.log('fieldnameTruncated: ' + part[3]);
      } else {
        if (!part.filename) {
          // user click `upload` before choose a file,
          // `part` will be file stream, but `part.filename` is empty
          // must handler this, such as log error.
          await sendToWormhole(part);
          continue;
        }
        // otherwise, it's a stream
        // console.log('field: ' + part.fieldname);
        // console.log('filename: ' + part.filename);
        // console.log('encoding: ' + part.encoding);
        // console.log('mime: ' + part.mime);
        // part.readableLength 31492 检查单个文件的大小
        // 超过长度，则跳过该文件
        // 检查extension，失败跳过该文件
        // const ext = extname(part.filename);
        if (checkFileExtension(extname(part.filename))) {
          if (checkSingleFileSize(part.readableLength)) {
            // 计算总大小
            totalSize += part.readableLength;
            const tmp = cloneDeep(part);
            files.push(tmp);
          }
        }
        // 恢复再次接受data
        part.resume();
      }
    }
    if (!checkTotalFileSize(totalSize)) {
      throw new FileTooLargeException();
    }
    return files;
  };
};

function checkSingleFileSize(size: number) {
  // file_include,file_exclude,file_single_limit,file_total_limit,file_store_dir
  // 默认 2M
  const confSize = config.getItem('file_single_limit', 1024 * 1024 * 2);
  return confSize > size;
}

function checkTotalFileSize(size: number) {
  // 默认 20M
  const confSize = config.getItem('file_total_limit', 1024 * 1024 * 20);
  return confSize > size;
}

function checkFileExtension(ext: string) {
  const fileInclude = config.getItem('file_include');
  const fileExclude = config.getItem('file_exclude');
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
