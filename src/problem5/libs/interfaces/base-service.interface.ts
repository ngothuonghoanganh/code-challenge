export interface BaseService<
  TResponse,
  TCreateRequest,
  TUpdateRequest,
  TListQuery,
  TListResponse,
> {
  create(input: TCreateRequest): Promise<TResponse>;
  list(query: TListQuery): Promise<TListResponse>;
  getById(id: string): Promise<TResponse>;
  update(id: string, input: TUpdateRequest): Promise<TResponse>;
  delete(id: string): Promise<void>;
}
