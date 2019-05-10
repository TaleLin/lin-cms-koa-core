import Sequelize from 'sequelize';
import { merge } from 'lodash';
import { UserAdmin, UserActive } from './enums';
import dayjs from 'dayjs';
import { generate } from './password-hash';

/**
 * 记录信息的mixin
 */
export const InfoCrudMixin = {
  attributes: {},
  options: {
    createdAt: 'create_time',
    updatedAt: 'update_time',
    deletedAt: 'delete_time',
    paranoid: true,
    getterMethods: {
      createTime() {
        // @ts-ignore
        return dayjs(this.getDataValue('create_time')).unix() * 1000;
      }
    }
  }
};

/**
 * 用户接口
 */
export const UserInterface = {
  attributes: {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    nickname: {
      type: Sequelize.STRING({ length: 24 }),
      allowNull: false,
      unique: true
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
  options: merge(
    {
      tableName: 'lin_user',
      getterMethods: {
        isAdmin() {
          // @ts-ignore
          return this.getDataValue('admin') === UserAdmin.ADMIN;
        },
        isActive() {
          // @ts-ignore
          return this.getDataValue('active') === UserActive.ACTIVE;
        }
      }
    },
    InfoCrudMixin.options
  )
};

/**
 * 权限接口
 */
export const AuthInterface = {
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
export const GroupInterface = {
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
export const LogInterface = {
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
        return dayjs(this.getDataValue('time')).unix() * 1000;
      }
    }
  }
};
