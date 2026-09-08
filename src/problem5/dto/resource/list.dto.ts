import type { ResourceStatus, ResourceType } from "../../libs/types";

export type ListResourceQueryDto = {
  search?: string;
  q?: string;
  status?: ResourceStatus;
  type?: ResourceType;
  ownerId?: string;
  parentId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: "createdAt" | "updatedAt" | "name" | "code" | "type";
  order?: "asc" | "desc";
};
