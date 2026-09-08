import type { NextFunction, Request, Response } from "express";
import type { ParamsDictionary } from "express-serve-static-core";

export type BaseRequest<
  TParams extends ParamsDictionary = ParamsDictionary,
  TBody = unknown,
> = Request<TParams, unknown, TBody>;

export type BaseResponse<TBody = unknown> = Response<TBody>;

export type BaseController<
  TParams extends ParamsDictionary = ParamsDictionary,
  TRequestBody = unknown,
  TResponseBody = unknown,
> = (
  req: BaseRequest<TParams, TRequestBody>,
  res: BaseResponse<TResponseBody>,
  next: NextFunction,
) => void;
