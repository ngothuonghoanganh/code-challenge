const path = require("node:path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const storage = process.env.DB_FILE || path.resolve(process.cwd(), "data/problem5.sqlite");

module.exports = {
  development: {
    dialect: "sqlite",
    storage,
    logging: false,
  },
  test: {
    dialect: "sqlite",
    storage,
    logging: false,
  },
};
