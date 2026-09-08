import { body, query, type ValidationChain } from "express-validator";
import {
  RESOURCE_STATUSES,
  RESOURCE_TYPES,
  RESOURCE_WRITABLE_STATUSES,
} from "../../constants";

const RESOURCE_FIELDS = [
  "name",
  "code",
  "type",
  "description",
  "status",
  "ownerId",
  "parentId",
  "metadata",
  "createdBy",
  "updatedBy",
];
const QUERY_FIELDS = [
  "search",
  "q",
  "status",
  "type",
  "ownerId",
  "parentId",
  "page",
  "pageSize",
  "sortBy",
  "order",
];

export const createResourceValidation: ValidationChain[] = [
  rejectUnknownFields(RESOURCE_FIELDS),
  body("name")
    .isString()
    .withMessage("name must be a string")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("name must contain between 1 and 200 characters"),
  body("code")
    .isString()
    .withMessage("code must be a string")
    .trim()
    .matches(/^[A-Za-z0-9._-]+$/)
    .withMessage("code may contain only letters, numbers, dots, underscores, and hyphens")
    .isLength({ min: 1, max: 100 })
    .withMessage("code must contain between 1 and 100 characters"),
  body("type").isIn(RESOURCE_TYPES).withMessage(`type must be one of: ${RESOURCE_TYPES.join(", ")}`),
  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("description must be a string or null")
    .trim()
    .isLength({ max: 2_000 })
    .withMessage("description must not exceed 2000 characters"),
  body("status")
    .optional()
    .isIn(RESOURCE_WRITABLE_STATUSES)
    .withMessage(`status must be one of: ${RESOURCE_WRITABLE_STATUSES.join(", ")}`),
  body("ownerId").isUUID().withMessage("ownerId must be a valid UUID"),
  body("parentId").optional({ nullable: true }).isUUID().withMessage("parentId must be a valid UUID or null"),
  body("metadata")
    .optional({ nullable: true })
    .custom(isMetadata)
    .withMessage("metadata must be a JSON object or null"),
  body("createdBy").isUUID().withMessage("createdBy must be a valid UUID"),
  body("updatedBy").optional().isUUID().withMessage("updatedBy must be a valid UUID"),
];

export const updateResourceValidation: ValidationChain[] = [
  rejectUnknownFields(RESOURCE_FIELDS.filter((field) => field !== "createdBy")),
  body().custom((value) => {
    if (isPlainObject(value) && Object.keys(value).length > 0) return true;
    throw new Error("At least one field is required");
  }),
  body("name")
    .optional()
    .isString()
    .withMessage("name must be a string")
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage("name must contain between 1 and 200 characters"),
  body("code")
    .optional()
    .isString()
    .withMessage("code must be a string")
    .trim()
    .matches(/^[A-Za-z0-9._-]+$/)
    .withMessage("code may contain only letters, numbers, dots, underscores, and hyphens")
    .isLength({ min: 1, max: 100 })
    .withMessage("code must contain between 1 and 100 characters"),
  body("type").optional().isIn(RESOURCE_TYPES).withMessage(`type must be one of: ${RESOURCE_TYPES.join(", ")}`),
  body("description")
    .optional({ nullable: true })
    .isString()
    .withMessage("description must be a string or null")
    .trim()
    .isLength({ max: 2_000 })
    .withMessage("description must not exceed 2000 characters"),
  body("status")
    .optional()
    .isIn(RESOURCE_WRITABLE_STATUSES)
    .withMessage(`status must be one of: ${RESOURCE_WRITABLE_STATUSES.join(", ")}`),
  body("ownerId").optional().isUUID().withMessage("ownerId must be a valid UUID"),
  body("parentId").optional({ nullable: true }).isUUID().withMessage("parentId must be a valid UUID or null"),
  body("metadata")
    .optional({ nullable: true })
    .custom(isMetadata)
    .withMessage("metadata must be a JSON object or null"),
  body("updatedBy").optional().isUUID().withMessage("updatedBy must be a valid UUID"),
];

export const listResourceValidation: ValidationChain[] = [
  rejectUnknownQueryFields(QUERY_FIELDS),
  query("search").optional().isString().withMessage("search must be a string").trim().isLength({ max: 100 }),
  query("q").optional().isString().withMessage("q must be a string").trim().isLength({ max: 100 }),
  query("status").optional().isIn(RESOURCE_STATUSES).withMessage("status is invalid"),
  query("type").optional().isIn(RESOURCE_TYPES).withMessage("type is invalid"),
  query("ownerId").optional().isUUID().withMessage("ownerId must be a valid UUID"),
  query("parentId").optional().isUUID().withMessage("parentId must be a valid UUID"),
  query("page").optional().isInt({ min: 1 }).withMessage("page must be an integer greater than 0").toInt(),
  query("pageSize")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("pageSize must be an integer between 1 and 100")
    .toInt(),
  query("sortBy")
    .optional()
    .isIn(["createdAt", "updatedAt", "name", "code", "type"])
    .withMessage("sortBy is invalid"),
  query("order").optional().isIn(["asc", "desc"]).withMessage("order must be asc or desc"),
];

function rejectUnknownFields(allowedFields: string[]): ValidationChain {
  return body().custom((value) => {
    if (!isPlainObject(value)) throw new Error("Request body must be a JSON object");
    rejectUnknown(Object.keys(value), allowedFields);
    return true;
  });
}

function rejectUnknownQueryFields(allowedFields: string[]): ValidationChain {
  return query().custom((value) => {
    rejectUnknown(Object.keys(value), allowedFields);
    return true;
  });
}

function rejectUnknown(fields: string[], allowedFields: string[]): void {
  const unknownFields = fields.filter((field) => !allowedFields.includes(field));
  if (unknownFields.length > 0) {
    throw new Error(`Unknown field: ${unknownFields.join(", ")}`);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMetadata(value: unknown): boolean {
  return isPlainObject(value);
}
