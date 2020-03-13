import Application from 'koa'
import { MulOpts } from '../types'
import asyncBusboy from 'async-busboy';
import { HttpException,FileExtensionException, FileTooLargeException,FileTooManyException } from '../exception/'
import { extname } from 'path';
import { config } from '../config';
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
      onFile: async function(fieldname, file, filename, encoding, mimetype) {
        const filePromise = new Promise((resolve, reject) => {
          let bufs = [];
          file
            .on('error', err => {
              file.resume();
              reject(err);
            })
            .on('data', (d: never) => {
              bufs.push(d);
            })
            .on('end', () => {
              const buf = Buffer.concat(bufs);
              resolve({
                size: buf.length,
                encoding: encoding,
                fieldname: fieldname,
                filename: filename,
                mimeType: mimetype,
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
        throw new HttpException({ msg: '文件体损坏，无法读取' });
      }
      const ext = extname(file.filename);
      if (
        !checkFileExtension(ext, opts && opts.include, opts && opts.exclude)
      ) {
        throw new FileExtensionException({ msg: `不支持类型为${ext}的文件` });
      }
      const { valid, conf } = checkSingleFileSize(
        file.size,
        opts && opts.singleLimit
      );
      if (!valid) {
        throw new FileTooLargeException({
          msg: `${file.filename}大小不能超过${conf}字节`
        });
      }
      // 计算总大小
      totalSize += file.size;
      files.push(file);
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
