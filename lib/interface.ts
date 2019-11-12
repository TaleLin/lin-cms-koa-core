import Sequelize from 'sequelize';
import { UserAdmin, UserActive } from './enums';
import { generate } from './password-hash';
import { config } from './config';

/**
 * 记录信息的mixin
 */
export let InfoCrudMixin = {
  attributes: {},
  options: {
    createdAt: 'create_time',
    updatedAt: 'update_time',
    deletedAt: 'delete_time',
    paranoid: true,
    getterMethods: {
      createTime() {
        // @ts-ignore
        return new Date(this.getDataValue('create_time')).getTime();
      },
      updateTime() {
        // @ts-ignore
        return new Date(this.getDataValue('update_time')).getTime();
      }
    }
  }
};

/**
 * 用户接口
 */
export let UserInterface = {
  attributes: {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    username: {
      type: Sequelize.STRING({ length: 24 }),
      allowNull: false,
      unique: true
    },
    nickname: {
      type: Sequelize.STRING({ length: 24 }),
      comment: '昵称',
      allowNull: true
    },
    avatar: {
      // 用户默认生成图像，为null
      type: Sequelize.STRING({ length: 500 }),
      comment: '头像url',
      get() {
        // @ts-ignore
        return this.getDataValue('avatar') ? config.getItem('siteDomain').replace(/\/+$/, '') + '/assets/' + this.getDataValue('avatar') : null;
      }

    },
    admin: {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    active: {
      type: Sequelize.TINYINT,
      allowNull: false,
      defaultValue: 1
    },
    email: {
      type: Sequelize.STRING({ length: 100 }),
      unique: true,
      allowNull: true
    },
    group_id: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    password: {
      type: Sequelize.STRING({ length: 100 }),
      set(ps) {
        // @ts-ignore
        this.setDataValue('password', generate(ps));
      },
      get() {
        // @ts-ignore
        return this.getDataValue('password');
      }
    }
  },
  options: {
    tableName: 'lin_user',
    createdAt: 'create_time',
    updatedAt: 'update_time',
    deletedAt: 'delete_time',
    paranoid: true,
    getterMethods: {
      isAdmin() {
        // @ts-ignore
        return this.getDataValue('admin') === UserAdmin.ADMIN;
      },
      isActive() {
        // @ts-ignore
        return this.getDataValue('active') === UserActive.ACTIVE;
      },
      createTime() {
        // @ts-ignore
        return new Date(this.getDataValue('create_time')).getTime();
      },
      updateTime() {
        // @ts-ignore
        return new Date(this.getDataValue('update_time')).getTime();
      }
    }
  }
};

/**
 * 权限接口
 */
export let AuthInterface = {
  attributes: {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    group_id: {
      type: Sequelize.INTEGER,
      allowNull: true
    },
    auth: {
      type: Sequelize.STRING({ length: 60 })
    },
    module: {
      type: Sequelize.STRING({ length: 50 })
    }
  },
  options: {
    tableName: 'lin_auth',
    createdAt: false,
    updatedAt: false
  }
};

/**
 * 分组接口
 */
export let GroupInterface = {
  attributes: {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: Sequelize.STRING({ length: 60 })
    },
    info: {
      type: Sequelize.STRING({ length: 255 }),
      allowNull: true
    }
  },
  options: {
    tableName: 'lin_group',
    createdAt: false,
    updatedAt: false
  }
};

/**
 * 日志接口
 */
export let LogInterface = {
  attributes: {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    message: {
      type: Sequelize.STRING({ length: 450 })
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false
    },
    user_name: {
      type: Sequelize.STRING(20)
    },
    status_code: {
      type: Sequelize.INTEGER
    },
    method: {
      type: Sequelize.STRING(20)
    },
    path: {
      type: Sequelize.STRING(50)
    },
    authority: {
      type: Sequelize.STRING(100)
    }
  },
  options: {
    tableName: 'lin_log',
    createdAt: 'time',
    updatedAt: false,
    getterMethods: {
      time() {
        // @ts-ignore
        return new Date(this.getDataValue('time')).getTime();
      }
    }
  }
};

/**
 * 文件接口
 */
export let FileInterface = {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  path: {
    type: Sequelize.STRING({ length: 500 }),
    allowNull: false
  },
  type: {
    type: Sequelize.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '1 local，其他表示其他地方'
  },
  name: {
    type: Sequelize.STRING(100),
    allowNull: false
  },
  extension: {
    type: Sequelize.STRING(50)
  },
  size: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  // 建立索引，方便搜索
  // 域名配置
  md5: {
    type: Sequelize.STRING(40),
    allowNull: true,
    unique: true,
    comment: '图片md5值，防止上传重复图片'
  }
};
