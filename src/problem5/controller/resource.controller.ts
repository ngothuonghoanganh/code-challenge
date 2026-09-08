import { Router, type RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { validationResult } from "express-validator";
import { EXCEPTION_CODES } from "../constants";
import { AppError } from "../libs/errors";
import {
  createResourceValidation,
  listResourceValidation,
  updateResourceValidation,
} from "../dto/resource/validation";
import type { CreateResourceDto } from "../dto/resource/create.dto";
import type { ListResourceQueryDto } from "../dto/resource/list.dto";
import type { ResourceResponseEnvelopeDto, ResourceListResponseDto } from "../dto/resource/response.dto";
import type { UpdateResourceDto } from "../dto/resource/update.dto";
import type { BaseController, BaseRequest } from "../libs/types";
import { ResourceService } from "../service/resource.service";

type ResourceIdParams = { id: string };

export class ResourceController {
  constructor(private readonly service: ResourceService) {}

  create: BaseController<ParamsDictionary, CreateResourceDto, ResourceResponseEnvelopeDto> = async (req, res, next) => {
    try {
      const resource = await this.service.create(req.body as CreateResourceDto);
      res.status(201).json({ data: resource });
    } catch (error) {
      next(error);
    }
  };

  list: BaseController<ParamsDictionary, unknown, ResourceListResponseDto> = async (req, res, next) => {
    try {
      const query = req.query as unknown as ListResourceQueryDto;
      const result = await this.service.list({
        search: query.search ?? query.q,
        status: query.status,
        type: query.type,
        ownerId: query.ownerId,
        parentId: query.parentId,
        page: Number(query.page ?? 1),
        pageSize: Number(query.pageSize ?? 20),
        sortBy: query.sortBy ?? "createdAt",
        order: query.order ?? "desc",
      });
      const pageSize = Number(query.pageSize ?? 20);

      res.json({
        data: result.data,
        meta: {
          page: Number(query.page ?? 1),
          pageSize,
          total: result.total,
          totalPages: result.total === 0 ? 0 : Math.ceil(result.total / pageSize),
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getById: BaseController<ResourceIdParams, unknown, ResourceResponseEnvelopeDto> = async (req, res, next) => {
    try {
      const resource = await this.service.getById(this.getRouteParam(req, "id"));
      res.json({ data: resource });
    } catch (error) {
      next(error);
    }
  };

  update: BaseController<ResourceIdParams, UpdateResourceDto, ResourceResponseEnvelopeDto> = async (req, res, next) => {
    try {
      const resource = await this.service.update(
        this.getRouteParam(req, "id"),
        req.body as UpdateResourceDto,
      );
      res.json({ data: resource });
    } catch (error) {
      next(error);
    }
  };

  delete: BaseController<ResourceIdParams, unknown, void> = async (req, res, next) => {
    try {
      await this.service.delete(this.getRouteParam(req, "id"));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  private getRouteParam(req: BaseRequest<ResourceIdParams>, name: keyof ResourceIdParams): string {
    const value = req.params[name];
    if (typeof value !== "string" || value.length === 0) {
      throw new AppError(EXCEPTION_CODES.INVALID_PARAMETER, `${name} must be a non-empty string`);
    }
    return value;
  }
}

export const validateRequest: RequestHandler = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
    return;
  }

  next(
    new AppError(
      EXCEPTION_CODES.VALIDATION_ERROR,
      "Request validation failed",
      errors.array().map((error) => ({
        field: "path" in error && error.path ? error.path : "request",
        message: error.msg,
      })),
    ),
  );
};

export function createResourceRouter(controller: ResourceController): Router {
  const router = Router();

  router.post("/", createResourceValidation, validateRequest, controller.create);
  router.get("/", listResourceValidation, validateRequest, controller.list);
  router.get("/:id", controller.getById);
  router.patch("/:id", updateResourceValidation, validateRequest, controller.update);
  router.delete("/:id", controller.delete);

  return router;
}
