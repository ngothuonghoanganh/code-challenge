import { NotFoundError } from "../libs/errors";
import { EXCEPTION_CODES } from "../constants";
import type { CreateResourceDto } from "../dto/resource/create.dto";
import type { ResourceResponseDto } from "../dto/resource/response.dto";
import type { UpdateResourceDto } from "../dto/resource/update.dto";
import type { ListResourcesInput, ResourceListResult } from "../libs/types";
import type { BaseService } from "../libs/types";
import type { Resource } from "../model/resource.model";
import { ResourceRepository } from "../model/resource.repository";

export class ResourceService implements
  BaseService<
    ResourceResponseDto,
    CreateResourceDto,
    UpdateResourceDto,
    ListResourcesInput,
    ResourceListResult<ResourceResponseDto>
  >
{
  constructor(private readonly repository: ResourceRepository) {}

  async create(input: CreateResourceDto): Promise<ResourceResponseDto> {
    return toResourceResponse(await this.repository.create(input));
  }

  async list(input: ListResourcesInput): Promise<ResourceListResult<ResourceResponseDto>> {
    const result = await this.repository.list(input);
    return { data: result.data.map(toResourceResponse), total: result.total };
  }

  async getById(id: string): Promise<ResourceResponseDto> {
    const resource = await this.repository.findById(id);
    if (!resource || resource.status === "DELETED") {
      throw new NotFoundError(EXCEPTION_CODES.RESOURCE_NOT_FOUND, "Resource not found");
    }
    return toResourceResponse(resource);
  }

  async update(id: string, input: UpdateResourceDto): Promise<ResourceResponseDto> {
    const resource = await this.repository.update(id, input);
    if (!resource) throw new NotFoundError(EXCEPTION_CODES.RESOURCE_NOT_FOUND, "Resource not found");
    return toResourceResponse(resource);
  }

  async delete(id: string): Promise<void> {
    if (!(await this.repository.delete(id))) {
      throw new NotFoundError(EXCEPTION_CODES.RESOURCE_NOT_FOUND, "Resource not found");
    }
  }
}

function toResourceResponse(resource: Resource): ResourceResponseDto {
  return {
    id: resource.id,
    name: resource.name,
    code: resource.code,
    type: resource.type,
    description: resource.description,
    ownerId: resource.ownerId,
    parentId: resource.parentId,
    metadata: resource.metadata,
    status: resource.status,
    createdBy: resource.createdBy,
    updatedBy: resource.updatedBy,
    createdAt: resource.createdAt.toISOString(),
    updatedAt: resource.updatedAt.toISOString(),
    deletedAt: resource.deletedAt?.toISOString() ?? null,
  };
}
