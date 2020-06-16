import { config } from '../../config'
import path from 'path'

config.init(path.resolve(__dirname, '../../../'))
config.getConfigFromFile('test/config.js');

describe('测试 Exception', () => {
  const Exception = require('../index')
  
  it('测试 HttpException 基础类', () => {
    const ex = new Exception.HttpException();
    expect(ex.status).toBe(500);
    expect(ex.code).toBe(9999);
  });
  
  it('测试 ParametersException 继承类', () => {
    const ex = new Exception.ParametersException();
    expect(ex.status).toBe(400);
    expect(ex.code).toBe(10030);
    expect(ex.message).toBe('参数错误');
  });
  
  it('测试 Success 继承类', () => {
    const ex = new Exception.Success();
    expect(ex.status).toBe(201);
    expect(ex.code).toBe(0);
    expect(ex.message).toBe('成功');
  });

  describe('测试传参', () => {
    it ('什么也不传', () => {
      const ex = new Exception.Success()
      expect(ex.status).toBe(201)
      expect(ex.code).toBe(0)
      expect(ex.message).toBe('成功')
    })

    it('只传一个 code', () => {
      const ex = new Exception.Success(1)
      expect(ex.status).toBe(201)
      expect(ex.code).toBe(1)
      expect(ex.message).toBe('创建成功')
    })

    it('只传 { code }', () => {
      const ex = new Exception.Success({
        code: 1
      })
      expect(ex.status).toBe(201)
      expect(ex.code).toBe(1)
      expect(ex.message).toBe('创建成功')
    })

    it('只传 { message }', () => {
      const ex = new Exception.Success({
        message: '测试 message 创建成功'
      })
      expect(ex.status).toBe(201)
      expect(ex.code).toBe(0)
      expect(ex.message).toBe('测试 message 创建成功')
    })

    it('传 { code, message }', () => {
      const ex = new Exception.Success({
        code: 20,
        message: '测试 message 创建成功'
      })
      expect(ex.status).toBe(201)
      expect(ex.code).toBe(20)
      expect(ex.message).toBe('测试 message 创建成功')
    })
  })
})
