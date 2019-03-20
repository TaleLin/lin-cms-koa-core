import Sequelize from "sequelize";
import { config } from "./config";

// 拿到配置
const database = config.getItem("db.database", "lin-cms");
const type = config.getItem("db.type", "mysql");
const host = config.getItem("db.host", "localhost");
const port = config.getItem("db.port", 3306);
const username = config.getItem("db.username", "root");
const password = config.getItem("db.password", "123456");
const logging = config.getItem("db.logging", true);
export const db = new Sequelize(database, username, password, {
  host: host,
  port: port,
  dialect: type,
  logging: logging
});
