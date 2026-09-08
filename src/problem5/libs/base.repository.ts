import type {
  Attributes,
  CreationAttributes,
  CreateOptions,
  DestroyOptions,
  FindAndCountOptions,
  FindOptions,
  Model,
  ModelStatic,
  WhereOptions,
} from "sequelize";

type PrimaryKey = string | number;

export abstract class BaseRepository<
  TModel extends Model,
  TCreateInput extends CreationAttributes<TModel> = CreationAttributes<TModel>,
  TUpdateInput extends Partial<Attributes<TModel>> = Partial<Attributes<TModel>>,
> {
  protected constructor(protected readonly model: ModelStatic<TModel>) {}

  async findAll(options: FindOptions = {}): Promise<TModel[]> {
    return this.model.findAll(options);
  }

  async findById(id: PrimaryKey, options: FindOptions = {}): Promise<TModel | null> {
    return this.model.findByPk(id, options);
  }

  async findAndCountAll(options: FindAndCountOptions = {}): Promise<{
    rows: TModel[];
    count: number;
  }> {
    const result = await this.model.findAndCountAll(options);
    const count = result.count;
    return {
      rows: result.rows,
      count: Array.isArray(count) ? count.length : count,
    };
  }

  async create(input: TCreateInput, options: CreateOptions = {}): Promise<TModel> {
    return this.model.create(input, options);
  }

  async updateById(id: PrimaryKey, input: TUpdateInput): Promise<TModel | null> {
    const entity = await this.findById(id);
    if (!entity) return null;

    await entity.update(input);
    return entity;
  }

  async deleteById(id: PrimaryKey, options: DestroyOptions = {}): Promise<boolean> {
    const where = { id } as unknown as WhereOptions;
    const deleted = await this.model.destroy({ ...options, where });
    return deleted > 0;
  }

  async count(options: FindOptions = {}): Promise<number> {
    return this.model.count(options);
  }
}
