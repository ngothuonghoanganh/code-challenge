import type { ResourceStatus, ResourceType } from "../libs/types/resource.type";

export const RESOURCE_TYPES: ResourceType[] = ["FILE", "IMAGE", "SERVER", "ROOM"];
export const RESOURCE_STATUSES: ResourceStatus[] = ["ACTIVE", "INACTIVE", "DELETED"];
export const RESOURCE_WRITABLE_STATUSES: ResourceStatus[] = ["ACTIVE", "INACTIVE"];
