import { LinRouter } from '../lib/lin-router';
import { routeMetaInfo } from '../lib/core';
import { groupRequired } from '../lib/jwt';

// ts的装饰器只能对类和类方法使用，不能对函数直接使用
// 拒绝脸

test('测试红图挂载', () => {
  const rp = new LinRouter({ prefix: 'test' });
  console.log(routeMetaInfo);
  rp.linGet(
    '测试红图',
    '/',
    { auth: '打个招呼', module: '看看你咯', mount: true },
    groupRequired,
    async (ctx, next) => {
      ctx.body = 'world';
    }
  );

  // rp.match

  expect(routeMetaInfo).not.toBe(null);
  console.log(routeMetaInfo);
});
