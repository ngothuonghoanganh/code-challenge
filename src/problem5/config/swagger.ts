export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Problem 5 Resource CRUD Server",
    version: "1.0.0",
    description: "CRUD API for managing resources.",
  },
  servers: [{ url: "http://localhost:3000", description: "Local server" }],
  tags: [{ name: "Resources", description: "Resource management" }],
  paths: {
    "/health": {
      get: {
        summary: "Health check",
        responses: {
          "200": {
            description: "Server is healthy",
            content: { "application/json": { schema: { $ref: "#/components/schemas/HealthResponse" } } },
          },
        },
      },
    },
    "/api/v1/resources": {
      post: {
        tags: ["Resources"],
        summary: "Create a resource",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CreateResourceRequest" } } },
        },
        responses: {
          "201": {
            description: "Resource created",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ResourceResponse" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
      get: {
        tags: ["Resources"],
        summary: "List resources",
        parameters: [
          { $ref: "#/components/parameters/Search" },
          { $ref: "#/components/parameters/Status" },
          { $ref: "#/components/parameters/Type" },
          { $ref: "#/components/parameters/OwnerId" },
          { $ref: "#/components/parameters/ParentId" },
          { $ref: "#/components/parameters/Page" },
          { $ref: "#/components/parameters/PageSize" },
          { $ref: "#/components/parameters/SortBy" },
          { $ref: "#/components/parameters/Order" },
        ],
        responses: {
          "200": {
            description: "Resource list",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ResourceListResponse" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
        },
      },
    },
    "/api/v1/resources/{id}": {
      parameters: [{ $ref: "#/components/parameters/ResourceId" }],
      get: {
        tags: ["Resources"],
        summary: "Get a resource",
        responses: {
          "200": {
            description: "Resource details",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ResourceResponse" } } },
          },
          "404": { $ref: "#/components/responses/NotFoundError" },
        },
      },
      patch: {
        tags: ["Resources"],
        summary: "Update a resource",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/UpdateResourceRequest" } } },
        },
        responses: {
          "200": {
            description: "Resource updated",
            content: { "application/json": { schema: { $ref: "#/components/schemas/ResourceResponse" } } },
          },
          "400": { $ref: "#/components/responses/ValidationError" },
          "404": { $ref: "#/components/responses/NotFoundError" },
        },
      },
      delete: {
        tags: ["Resources"],
        summary: "Soft-delete a resource",
        responses: {
          "204": { description: "Resource soft-deleted" },
          "404": { $ref: "#/components/responses/NotFoundError" },
        },
      },
    },
  },
  components: {
    parameters: {
      ResourceId: { name: "id", in: "path", required: true, schema: { type: "string", format: "uuid" } },
      Search: { name: "search", in: "query", schema: { type: "string", maxLength: 100 } },
      Status: { name: "status", in: "query", schema: { $ref: "#/components/schemas/ResourceStatus" } },
      Type: { name: "type", in: "query", schema: { $ref: "#/components/schemas/ResourceType" } },
      OwnerId: { name: "ownerId", in: "query", schema: { type: "string", format: "uuid" } },
      ParentId: { name: "parentId", in: "query", schema: { type: "string", format: "uuid" } },
      Page: { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
      PageSize: { name: "pageSize", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
      SortBy: {
        name: "sortBy",
        in: "query",
        schema: { type: "string", enum: ["createdAt", "updatedAt", "name", "code", "type"], default: "createdAt" },
      },
      Order: { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
    },
    responses: {
      ValidationError: {
        description: "Request validation failed",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
      NotFoundError: {
        description: "Resource not found",
        content: { "application/json": { schema: { $ref: "#/components/schemas/ErrorResponse" } } },
      },
    },
    schemas: {
      ResourceType: { type: "string", enum: ["FILE", "IMAGE", "SERVER", "ROOM"] },
      ResourceStatus: { type: "string", enum: ["ACTIVE", "INACTIVE", "DELETED"] },
      ResourceMetadata: { type: "object", additionalProperties: true, nullable: true },
      Resource: {
        type: "object",
        required: [
          "id",
          "name",
          "code",
          "type",
          "description",
          "ownerId",
          "parentId",
          "metadata",
          "status",
          "createdBy",
          "updatedBy",
          "createdAt",
          "updatedAt",
          "deletedAt",
        ],
        properties: {
          id: { type: "string", format: "uuid" },
          name: { type: "string", maxLength: 200 },
          code: { type: "string", maxLength: 100 },
          type: { $ref: "#/components/schemas/ResourceType" },
          description: { type: "string", nullable: true, maxLength: 2000 },
          ownerId: { type: "string", format: "uuid" },
          parentId: { type: "string", format: "uuid", nullable: true },
          metadata: { $ref: "#/components/schemas/ResourceMetadata" },
          status: { $ref: "#/components/schemas/ResourceStatus" },
          createdBy: { type: "string", format: "uuid" },
          updatedBy: { type: "string", format: "uuid" },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
          deletedAt: { type: "string", format: "date-time", nullable: true },
        },
      },
      CreateResourceRequest: {
        type: "object",
        required: ["name", "code", "type", "ownerId", "createdBy"],
        additionalProperties: false,
        properties: {
          name: { type: "string", minLength: 1, maxLength: 200 },
          code: { type: "string", minLength: 1, maxLength: 100 },
          type: { $ref: "#/components/schemas/ResourceType" },
          description: { type: "string", nullable: true, maxLength: 2000 },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
          ownerId: { type: "string", format: "uuid" },
          parentId: { type: "string", format: "uuid", nullable: true },
          metadata: { $ref: "#/components/schemas/ResourceMetadata" },
          createdBy: { type: "string", format: "uuid" },
          updatedBy: { type: "string", format: "uuid" },
        },
      },
      UpdateResourceRequest: {
        type: "object",
        minProperties: 1,
        additionalProperties: false,
        properties: {
          name: { type: "string", minLength: 1, maxLength: 200 },
          code: { type: "string", minLength: 1, maxLength: 100 },
          type: { $ref: "#/components/schemas/ResourceType" },
          description: { type: "string", nullable: true, maxLength: 2000 },
          status: { type: "string", enum: ["ACTIVE", "INACTIVE"] },
          ownerId: { type: "string", format: "uuid" },
          parentId: { type: "string", format: "uuid", nullable: true },
          metadata: { $ref: "#/components/schemas/ResourceMetadata" },
          updatedBy: { type: "string", format: "uuid" },
        },
      },
      ResourceResponse: {
        type: "object",
        required: ["data"],
        properties: { data: { $ref: "#/components/schemas/Resource" } },
      },
      ResourceListResponse: {
        type: "object",
        required: ["data", "meta"],
        properties: {
          data: { type: "array", items: { $ref: "#/components/schemas/Resource" } },
          meta: {
            type: "object",
            properties: {
              page: { type: "integer" },
              pageSize: { type: "integer" },
              total: { type: "integer" },
              totalPages: { type: "integer" },
            },
          },
        },
      },
      HealthResponse: {
        type: "object",
        properties: { data: { type: "object", properties: { status: { type: "string", example: "ok" } } } },
      },
      ErrorResponse: {
        type: "object",
        required: ["error"],
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
  },
} as const;
