/**
 * 测试 config
 */
import { Config } from '../config';
import { config } from '../index'
import path from 'path'

config.init(path.resolve(__dirname, '../../../'))
config.getConfigFromFile('test/config.js');

describe('测试 config', () => {
  test('读取lin为前缀的配置', () => {
    // 读取以 LIN开头的
    // 1. 先从环境变量里面去读取 判断何种环境
    // 2. 得到何种环境后，选择去读取什么配置文件
    // 3. 读取配置文件，然后用环境变量去覆盖
    process.env.lin_env = 'debug';
    process.env.lin_log_limit = '10';
    process.env.lin_log_file = 'access.log';
    const config = new Config();
  
    config.getConfigFromEnv();

    expect(config.getItem('env')).toBe('debug');
  });
  
  test('读取其它前缀pedro的配置', () => {
    process.env.pedro_env = 'debug';
    process.env.pedro_log_limit = '10';
    process.env.pedro_log_file = 'access.log';
    const config = new Config();
    config.prefix = 'pedro';
    config.getConfigFromEnv();

    expect(config.getEnv()).toBe('debug');
    expect(config.getItem('env')).toBe('debug');
  });

  it('测试获取 config 配置', () => {
    expect(config.getItem('hello', null)).toBe(null);
    expect(config.hasItem('hello')).toBe(false);
    
    expect(config.setItem('user.gender', 'man')).toBe(undefined);
    expect(config.getItem('user.name')).toBe('pedro');
    
    expect(config.getItem('codeMessage', {}).getMessage(0)).toBe('成功')
    
    config.getConfigFromObj({ header: 'user-agent', body: 'world' });
    expect(config.getItem('user.gender')).toBe('man');
    expect(config.getItem('body')).toBe('world');
  })
})
