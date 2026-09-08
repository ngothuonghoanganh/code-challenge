export type ResourceType = "FILE" | "IMAGE" | "SERVER" | "ROOM";
export type ResourceStatus = "ACTIVE" | "INACTIVE" | "DELETED";
export type ResourceMetadata = Record<string, unknown>;

export type ListResourcesInput = {
  search?: string;
  status?: ResourceStatus;
  type?: ResourceType;
  ownerId?: string;
  parentId?: string;
  page: number;
  pageSize: number;
  sortBy: "createdAt" | "updatedAt" | "name" | "code" | "type";
  order: "asc" | "desc";
};

export type ResourceListResult<T> = {
  data: T[];
  total: number;
};
