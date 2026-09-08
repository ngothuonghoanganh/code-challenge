import type { ResourceMetadata, ResourceStatus, ResourceType } from "../../libs/types";

export type CreateResourceDto = {
  name: string;
  code: string;
  type: ResourceType;
  description?: string | null;
  ownerId: string;
  parentId?: string | null;
  metadata?: ResourceMetadata | null;
  status?: ResourceStatus;
  createdBy: string;
  updatedBy?: string;
};
