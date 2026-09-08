import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { Sequelize } from "sequelize";
import { initializeResourceModel } from "../../model/resource.model";

export class SqliteDatabase {
  readonly sequelize: Sequelize;

  constructor(filePath: string) {
    if (filePath !== ":memory:") {
      mkdirSync(dirname(filePath), { recursive: true });
    }

    this.sequelize = new Sequelize({
      dialect: "sqlite",
      storage: filePath,
      logging: false,
    });

    initializeResourceModel(this.sequelize);
  }

  async close(): Promise<void> {
    await this.sequelize.close();
  }
}
