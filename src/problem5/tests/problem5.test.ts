import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createServer, type Server } from "node:http";
import { createApp, type Problem5App } from "../app";

const resourceMigration = require("../migrations/20260908000000-create-resources.cjs") as {
  up: (queryInterface: ReturnType<Problem5App["locals"]["sequelize"]["getQueryInterface"]>) => Promise<void>;
};

const ownerId = "11111111-1111-4111-8111-111111111111";
const creatorId = "22222222-2222-4222-8222-222222222222";
const updaterId = "33333333-3333-4333-8333-333333333333";

describe("Problem 5 Resource CRUD API", () => {
  let app: Problem5App;
  let server: Server;
  let baseUrl: string;

  before(async () => {
    app = createApp({ dbPath: ":memory:" });
    await resourceMigration.up(app.locals.sequelize.getQueryInterface());
    server = createServer(app);
    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    assert(address && typeof address !== "string");
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    await app.locals.close();
  });

  it("creates and reads a resource", async () => {
    const createResponse = await request("/api/v1/resources", {
      method: "POST",
      body: JSON.stringify({
        name: "Primary file storage",
        code: "file-primary",
        type: "FILE",
        description: "Stores uploaded files",
        ownerId,
        metadata: { region: "ap-southeast-1", capacity: 1000 },
        createdBy: creatorId,
      }),
    });
    assert.equal(createResponse.status, 201);
    const created = (await createResponse.json()) as {
      data: {
        id: string;
        name: string;
        code: string;
        type: string;
        status: string;
        ownerId: string;
        metadata: { region: string };
        deletedAt: string | null;
      };
    };
    assert.match(created.data.id, /^[0-9a-f-]{36}$/);
    assert.equal(created.data.name, "Primary file storage");
    assert.equal(created.data.code, "file-primary");
    assert.equal(created.data.type, "FILE");
    assert.equal(created.data.status, "ACTIVE");
    assert.equal(created.data.ownerId, ownerId);
    assert.equal(created.data.metadata.region, "ap-southeast-1");
    assert.equal(created.data.deletedAt, null);

    const getResponse = await request(`/api/v1/resources/${created.data.id}`);
    assert.equal(getResponse.status, 200);
    const fetched = (await getResponse.json()) as { data: { id: string } };
    assert.equal(fetched.data.id, created.data.id);
  });

  it("lists resources with filters and pagination", async () => {
    await request("/api/v1/resources", {
      method: "POST",
      body: JSON.stringify({
        name: "Production server",
        code: "server-production",
        type: "SERVER",
        status: "INACTIVE",
        ownerId,
        createdBy: creatorId,
      }),
    });

    const response = await request(`/api/v1/resources?type=SERVER&ownerId=${ownerId}&page=1&pageSize=10`);
    assert.equal(response.status, 200);
    const result = (await response.json()) as {
      data: Array<{ type: string; status: string }>;
      meta: { total: number };
    };
    assert.equal(result.meta.total, 1);
    assert.equal(result.data[0]?.type, "SERVER");
    assert.equal(result.data[0]?.status, "INACTIVE");
  });

  it("updates and soft-deletes a resource", async () => {
    const createResponse = await request("/api/v1/resources", {
      method: "POST",
      body: JSON.stringify({
        name: "Temporary room",
        code: "room-temporary",
        type: "ROOM",
        ownerId,
        createdBy: creatorId,
      }),
    });
    const created = (await createResponse.json()) as { data: { id: string } };

    const updateResponse = await request(`/api/v1/resources/${created.data.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        name: "Updated room",
        status: "INACTIVE",
        updatedBy: updaterId,
        metadata: { floor: 4 },
      }),
    });
    assert.equal(updateResponse.status, 200);
    const updated = (await updateResponse.json()) as {
      data: { name: string; status: string; updatedBy: string; metadata: { floor: number } };
    };
    assert.equal(updated.data.name, "Updated room");
    assert.equal(updated.data.status, "INACTIVE");
    assert.equal(updated.data.updatedBy, updaterId);
    assert.equal(updated.data.metadata.floor, 4);

    const deleteResponse = await request(`/api/v1/resources/${created.data.id}`, { method: "DELETE" });
    assert.equal(deleteResponse.status, 204);

    const missingResponse = await request(`/api/v1/resources/${created.data.id}`);
    assert.equal(missingResponse.status, 404);

    const deletedListResponse = await request("/api/v1/resources?status=DELETED");
    assert.equal(deletedListResponse.status, 200);
    const deletedList = (await deletedListResponse.json()) as { data: Array<{ status: string; deletedAt: string }> };
    assert.equal(deletedList.data.some((resource) => resource.status === "DELETED"), true);
  });

  it("rejects invalid input with a useful error", async () => {
    const response = await request("/api/v1/resources", {
      method: "POST",
      body: JSON.stringify({ name: "", code: "invalid code", type: "UNKNOWN", ownerId: "invalid" }),
    });
    assert.equal(response.status, 400);
    const result = (await response.json()) as { error: { code: string; details: unknown[] } };
    assert.equal(result.error.code, "VALIDATION_ERROR");
    assert.ok(result.error.details.length >= 4);
  });

  async function request(path: string, init: RequestInit = {}): Promise<Response> {
    return fetch(`${baseUrl}${path}`, {
      ...init,
      headers: { "content-type": "application/json", ...(init.headers ?? {}) },
    });
  }
});
