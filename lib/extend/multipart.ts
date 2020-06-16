import Application from 'koa'
import { MulOpts, CodeMessage } from '../types'
import asyncBusboy from 'async-busboy';
import { HttpException,FileExtensionException, FileTooLargeException,FileTooManyException } from '../exception/'
import { extname } from 'path';
import { config } from '../config';

const CodeMessage = config.getItem('codeMessage', {}) as CodeMessage

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
    let filePromises: Promise<any>[] = [];
    const { fields } = await asyncBusboy(this.req, {
      onFile: async function(fieldName, file, filename, encoding, mimeType) {
        const filePromise = new Promise((resolve, reject) => {
          let buffers = [];
          file
            .on('error', err => {
              file.resume();
              reject(err);
            })
            .on('data', (d: never) => {
              buffers.push(d);
            })
            .on('end', () => {
              const buf = Buffer.concat(buffers);
              resolve({
                size: buf.length,
                encoding: encoding,
                fieldName: fieldName,
                filename: filename,
                mimeType: mimeType,
                data: buf
              });
            });
        });
        filePromises.push(filePromise);
      }
    });
    let files: any[] = [];
    let totalSize = 0;

    for (const filePromise of filePromises) {
      let file;
      try {
        file = await filePromise;
      } catch (error) {
        throw new HttpException({ code: 10210 });
      }
      const ext = extname(file.filename);
      if (
        !checkFileExtension(ext, opts && opts.include, opts && opts.exclude)
      ) {
        throw new FileExtensionException({
          code: 10130,
          message: CodeMessage.getMessage(10130).replace('{ext}', ext)
        });
      }
      const { valid, conf } = checkSingleFileSize(
        file.size,
        opts && opts.singleLimit
      );
      if (!valid) {
        throw new FileTooLargeException({
          code: 10110,
          message: CodeMessage.getMessage(10110)
            .replace('{name}', file.filename)
            .replace('{size}', conf)
        });
      }
      // 计算总大小
      totalSize += file.size;
      files.push(file);
    }
    const { valid, conf } = checkFileNums(files.length, opts && opts.fileNums);
    if (!valid) {
      throw new FileTooManyException({
        code: 10121,
        message: CodeMessage.getMessage(10121).replace('{num}', conf)
      });
    }
    const { valid: totalValid, conf: totalConf } = checkTotalFileSize(
      totalSize,
      opts && opts.totalLimit
    );
    if (!totalValid) {
      throw new FileTooLargeException({
        code: 10111,
        message: CodeMessage.getMessage(10111).replace('{size}', totalConf)
      });
    }
    this.request.fields = fields;
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
