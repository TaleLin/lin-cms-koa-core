import { config as conf } from '../lib/config/index';

test('测试Config', () => {
  conf.getConfigFromFile('tests/setting.js');
  expect(conf.getItem('hello', null)).toBe(null);
  expect(conf.hasItem('hello')).toBe(false);

  expect(conf.setItem('user.gender', 'man')).toBe(undefined);
  expect(conf.getItem('user.name')).toBe('pedro');

  conf.getConfigFromObj({ header: 'user-agent', body: 'world' });
  expect(conf.getItem('user.gender')).toBe('man');
  expect(conf.getItem('body')).toBe('world');
});
