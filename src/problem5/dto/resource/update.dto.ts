import type { ResourceMetadata, ResourceStatus, ResourceType } from "../../libs/types";

export type UpdateResourceDto = {
  name?: string;
  code?: string;
  type?: ResourceType;
  description?: string | null;
  ownerId?: string;
  parentId?: string | null;
  metadata?: ResourceMetadata | null;
  status?: ResourceStatus;
  updatedBy?: string;
};
