/**
 * 工厂方法
 */

/**
 * 扩展模型
 * @param superModel 基础模型
 * @param attributes 扩展的属性
 *
 * ```js
 * const { modelExtend } = require("lin-mizar/lin/factory");
 * const { UserInterface } = require("lin-mizar");
 * const Sequelize = require("sequelize");
 *
 * modelExtend(UserInterface, {
 * phone: {
 *  type: Sequelize.STRING(30),
 *  unique: true,
 *  allowNull: true
 *  }
 * });
 *
 * ```
 */
// export function modelExtend(superModel: any, attributes) {
//   superModel.tableAttributes = {
//     ...superModel.tableAttributes,
//     ...attributes
//   };
//   const model = class extends superModel {};
//   Object.keys(attributes).forEach(key => {
//     Object.defineProperty(model.prototype, key, {
//       get() {
//         return this.dataValues && this.dataValues[key];
//       }
//     });
//   });
//   return model;
// }

export function modelExtend(superModel: any, attributes) {
  // UserInterface.attributes
  superModel.attributes = { ...superModel.attributes, ...attributes };
}
