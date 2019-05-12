/**
 * 文件上传相关
 * file_include,file_exclude,file_single_limit,file_total_limit,file_store_dir
 * id,path,type,name,extension,size
 */
import uuid from 'uuid';
import dayjs from 'dayjs';
import path from 'path';
import fs from 'fs';
import { config } from './config';

/**
 * 上传文件类，所有文件上传的基类
 */
class Uploader {
  private storeDir: string | undefined;
  constructor(storeDir?: string) {
    this.storeDir = storeDir;
  }
  /**
   * 处理文件流Stream
   */
  public upload(files: any[]) {
    throw new Error('you must overload this method');
  }

  /**
   * 获得保存的路径名
   * @param filename 文件名
   */
  public getStorePath(filename: string) {
    const filename2 = this.generateName(filename);
    const dir = this.getExactStoreDir();
    const exists = fs.existsSync(dir);
    if (!exists) {
      fs.mkdirSync(dir);
    }
    return path.join(dir, filename2);
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
  public getExactStoreDir() {
    let storeDir = config.getItem('file_store_dir', 'assets');
    this.storeDir && (storeDir = this.storeDir);
    const extrat = path.isAbsolute(storeDir)
      ? path.join(storeDir, dayjs().format('YYYY/MM/DD'))
      : path.join(process.cwd(), storeDir, dayjs().format('YYYY/MM/DD'));
    return extrat;
  }
}
