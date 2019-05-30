/**
 * 文件上传相关
 * file_include,file_exclude,file_single_limit,file_total_limit,file_store_dir,siteDomain
 * id,path,type,name,extension,size,md5
 */
import uuid from 'uuid';
import dayjs from 'dayjs';
import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { config } from './config';
import { mkdirsSync } from './util';

/**
 * 上传文件类，所有文件上传的基类
 */
export class Uploader {
  private storeDir: string | undefined;
  constructor(storeDir?: string) {
    this.storeDir = storeDir;
  }
  /**
   * 处理文件流Stream
   */
  public async upload(files: any[]) {
    throw new Error('you must overload this method');
  }

  /**
   * 获得保存的路径名
   * @param filename 文件名
   */
  public getStorePath(filename: string) {
    const filename2 = this.generateName(filename);
    const formatDay = this.getFormatDay();
    const dir = this.getExactStoreDir(formatDay);
    const exists = fs.existsSync(dir);
    if (!exists) {
      mkdirsSync(dir);
    }
    return {
      absolutePath: path.join(dir, filename2),
      relativePath: `${formatDay}/${filename2}`,
      realName: filename2
    };
  }

  /**
   * 生成文件名
   * @param filename 文件名
   */
  public generateName(filename: string) {
    const ext = path.extname(filename);
    return `${uuid.v4()}${ext}`;
  }

  /**
   * 获得确切的保存路径
   */
  public getExactStoreDir(formatDay: string) {
    let storeDir = config.getItem('file.storeDir');
    if (!storeDir) {
      throw new Error('storeDir must not be undefined');
    }
    this.storeDir && (storeDir = this.storeDir);
    const extrat = path.isAbsolute(storeDir)
      ? path.join(storeDir, formatDay)
      : path.join(process.cwd(), storeDir, formatDay);
    return extrat;
  }

  /**
   * getFormatDay
   */
  public getFormatDay() {
    return dayjs().format('YYYY/MM/DD');
  }

  /**
   * 生成图片的md5
   */
  public generateMd5(data: any) {
    const buf = data._readableState.buffer.head.data;
    const md5 = crypto.createHash('md5');
    return md5.update(buf).digest('hex');
  }
}
