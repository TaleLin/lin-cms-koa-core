// phone: {
//   type: Sequelize.STRING,
//   unique: true,
//   allowNull: true
// }

export function modelExtend(superModel: any, attributes) {
  superModel.tableAttributes = {
    ...superModel.tableAttributes,
    ...attributes
  };
  const model = class extends superModel {};
  Object.keys(attributes).forEach(key => {
    Object.defineProperty(model.prototype, key, {
      get() {
        return this.dataValues && this.dataValues[key];
      }
    });
  });
  return model;
}
