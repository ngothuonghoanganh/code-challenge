import type { ResourceMetadata, ResourceStatus, ResourceType } from "../../libs/types";

export type ResourceResponseDto = {
  id: string;
  name: string;
  code: string;
  type: ResourceType;
  description: string | null;
  ownerId: string;
  parentId: string | null;
  metadata: ResourceMetadata | null;
  status: ResourceStatus;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type ResourceResponseEnvelopeDto = {
  data: ResourceResponseDto;
};

export type ResourceListResponseDto = {
  data: ResourceResponseDto[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
};
