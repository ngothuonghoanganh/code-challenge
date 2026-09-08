import {
  DataTypes,
  InferAttributes,
  InferCreationAttributes,
  Model,
  Sequelize,
} from "sequelize";
import type { CreationOptional } from "sequelize";
import type { ResourceMetadata, ResourceStatus, ResourceType } from "../libs/types";

export class Resource extends Model<InferAttributes<Resource>, InferCreationAttributes<Resource>> {
  declare id: CreationOptional<string>;
  declare name: string;
  declare code: string;
  declare type: ResourceType;
  declare description: string | null;
  declare ownerId: string;
  declare parentId: string | null;
  declare metadata: ResourceMetadata | null;
  declare status: ResourceStatus;
  declare createdBy: string;
  declare updatedBy: string;
  declare createdAt: Date;
  declare updatedAt: Date;
  declare deletedAt: Date | null;
}

export function initializeResourceModel(sequelize: Sequelize): typeof Resource {
  Resource.init(
    {
      id: {
        type: DataTypes.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: DataTypes.UUIDV4,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      type: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      ownerId: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "owner_id",
      },
      parentId: {
        type: DataTypes.UUID,
        allowNull: true,
        field: "parent_id",
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "created_by",
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: false,
        field: "updated_by",
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "created_at",
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: "updated_at",
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: "deleted_at",
      },
    },
    {
      sequelize,
      modelName: "Resource",
      tableName: "resources",
      freezeTableName: true,
      // Schema changes are managed only by migrations, not by Sequelize sync.
      timestamps: false,
    },
  );

  return Resource;
}
