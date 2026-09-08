import express, { type ErrorRequestHandler } from "express";
import swaggerUi from "swagger-ui-express";
import { EXCEPTION_CODES } from "./constants";
import { AppError, NotFoundError } from "./libs/errors";
import { swaggerDocument } from "./config/swagger";
import { SqliteDatabase } from "./libs/connection";
import { ResourceRepository } from "./model/resource.repository";
import { createResourceRouter, ResourceController } from "./controller/resource.controller";
import { ResourceService } from "./service/resource.service";
import type { Sequelize } from "sequelize";

export type AppOptions = {
  dbPath?: string;
};

export type Problem5App = express.Express & {
  locals: express.Express["locals"] & {
    sequelize: Sequelize;
    close: () => Promise<void>;
  };
};

export function createApp(options: AppOptions = {}): Problem5App {
  const database = new SqliteDatabase(options.dbPath ?? process.env.DB_FILE ?? "data/problem5.sqlite");
  const repository = new ResourceRepository();
  const service = new ResourceService(repository);
  const controller = new ResourceController(service);
  const app = express() as Problem5App;

  app.locals.sequelize = database.sequelize;
  app.locals.close = () => database.close();
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => {
    res.json({ data: { status: "ok" } });
  });

  app.get("/api-docs.json", (_req, res) => {
    res.json(swaggerDocument);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

  app.use("/api/v1/resources", createResourceRouter(controller));

  app.use((_req, _res, next) => {
    next(new AppError(EXCEPTION_CODES.ROUTE_NOT_FOUND, "Route not found"));
  });
  app.use(errorHandler);

  return app;
}

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
    });
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(404).json({
      error: { code: error.code, message: error.message },
    });
    return;
  }

  if (error instanceof SyntaxError && "body" in error) {
    res.status(400).json({
      error: { code: EXCEPTION_CODES.INVALID_JSON, message: "Request body must contain valid JSON" },
    });
    return;
  }

  console.error(error);
  res.status(500).json({
    error: { code: EXCEPTION_CODES.INTERNAL_SERVER_ERROR, message: "An unexpected error occurred" },
  });
};
