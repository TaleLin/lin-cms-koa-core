const Koa = require('koa');
const { Lin, log, error } = require('../lin');
const { config } = require('../lin/config');

// 需要mysql数据库，数据库名为lin-cms，默认用户名:root，密码:123456
const run = async () => {
  config.setItem('pluginPath', {});
  config.setItem('apiDir', 'example');

  const app = new Koa();
  config.initApp(app);
  app.use(log);
  app.on('error', error);
  const lin = new Lin();
  await lin.initApp(app, true, true);

  // const { File } = require('../lin/core');

  // File.createRecord(
  //   {
  //     path: '/flow.png',
  //     type: 1,
  //     name: 'flow',
  //     extension: '.png',
  //     size: 1024
  //   },
  //   true
  // );

  app.listen(3000, () => {
    console.log('listening at http://localhost:3000');
  });
};

run();
