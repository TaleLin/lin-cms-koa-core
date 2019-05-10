import { Config } from '../lib/config';

test('测试Config', () => {
  const conf = new Config();
  conf.getConfigFromFile('tests/setting.js');
  expect(conf.getItem('hello', null)).toBe(null);
  expect(conf.hasItem('hello')).toBe(false);

  expect(conf.setItem('user.gender', 'man')).toBe(undefined);
  expect(conf.getItem('user.name')).toBe('pedro');

  conf.getConfigFromObj({ header: 'user-agent', body: 'world' });
  expect(conf.getItem('user.gender')).toBe('man');
  expect(conf.getItem('body')).toBe('world');
});
