import { Op, type Order, type WhereOptions } from "sequelize";
import { BaseRepository } from "../libs";
import { Resource } from "./resource.model";
import type { CreateResourceDto } from "../dto/resource/create.dto";
import type { UpdateResourceDto } from "../dto/resource/update.dto";
import type { ListResourcesInput, ResourceListResult } from "../libs/types";

export class ResourceRepository extends BaseRepository<Resource> {
  constructor() {
    super(Resource);
  }

  async create(input: CreateResourceDto): Promise<Resource> {
    const now = new Date();

    return super.create({
      name: input.name,
      code: input.code,
      type: input.type,
      description: input.description ?? null,
      ownerId: input.ownerId,
      parentId: input.parentId ?? null,
      metadata: input.metadata ?? null,
      status: input.status ?? "ACTIVE",
      createdBy: input.createdBy,
      updatedBy: input.updatedBy ?? input.createdBy,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  async list(input: ListResourcesInput): Promise<ResourceListResult<Resource>> {
    const filters: WhereOptions[] = [];

    if (input.search) {
      const search = `%${input.search}%`;
      filters.push({
        [Op.or]: {
          name: { [Op.like]: search },
          code: { [Op.like]: search },
          description: { [Op.like]: search },
        },
      });
    }

    filters.push(input.status ? { status: input.status } : { status: { [Op.ne]: "DELETED" } });
    if (input.type) filters.push({ type: input.type });
    if (input.ownerId) filters.push({ ownerId: input.ownerId });
    if (input.parentId) filters.push({ parentId: input.parentId });

    const where: WhereOptions = filters.length > 0 ? { [Op.and]: filters } : {};
    const sortColumn: Record<ListResourcesInput["sortBy"], string> = {
      createdAt: "createdAt",
      updatedAt: "updatedAt",
      name: "name",
      code: "code",
      type: "type",
    };
    const order: Order = [
      [sortColumn[input.sortBy], input.order.toUpperCase() as "ASC" | "DESC"],
      ["id", "ASC"],
    ];

    const result = await this.findAndCountAll({
      where,
      order,
      limit: input.pageSize,
      offset: (input.page - 1) * input.pageSize,
    });

    return { data: result.rows, total: result.count };
  }

  async update(id: string, input: UpdateResourceDto): Promise<Resource | null> {
    const resource = await this.findById(id);
    if (!resource || resource.status === "DELETED") return null;

    resource.set(input)

    return resource.save()
  }

  async delete(id: string): Promise<boolean> {
    const resource = await this.findById(id);
    if (!resource || resource.status === "DELETED") return false;

    const now = new Date();
    await this.updateById(id, {
      status: "DELETED",
      deletedAt: now,
      updatedAt: now,
    });
    return true;
  }
}
