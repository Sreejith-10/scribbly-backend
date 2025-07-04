import { Logger } from '@nestjs/common';
import {
  FilterQuery,
  Model,
  Types,
  UpdateQuery,
  SaveOptions,
  Connection,
  ProjectionType,
  PipelineStage,
  QueryOptions,
} from 'mongoose';
import { AbstractDocument } from './abstract.schema';

export abstract class AbstractRepository<TDocument extends AbstractDocument> {
  protected abstract readonly logger: Logger;

  constructor(
    protected readonly model: Model<TDocument>,
    private readonly connection: Connection,
  ) {}

  async create(
    document: Omit<TDocument, '_id'>,
    options: SaveOptions = {},
  ): Promise<TDocument> {
    const createdDocument = new this.model({
      ...document,
      _id: new Types.ObjectId(),
    });
    return (
      await createdDocument.save(options)
    ).toJSON() as unknown as TDocument;
  }

  async find(
    filterQuery: FilterQuery<TDocument> = {},
    projection: ProjectionType<TDocument> = {},
  ): Promise<TDocument[]> {
    return (await this.model
      .find(filterQuery, projection, { lean: true })
      .exec()) as TDocument[];
  }

  async findById(
    id: any,
    projection: ProjectionType<TDocument> = {},
    options: QueryOptions = {},
  ) {
    return this.model.findById(id, projection, options);
  }

  async findOne(
    filterQuery: FilterQuery<TDocument> = {},
    projection: ProjectionType<TDocument> = {},
  ): Promise<TDocument> {
    const document = await this.model.findOne(filterQuery, projection, {
      lean: true,
    });

    if (!document) {
      this.logger.warn('Document not found with filterQuery', filterQuery);
    }

    return document as TDocument;
  }

  async findOneAndUpdate(
    filterQuery: FilterQuery<TDocument> = {},
    update: UpdateQuery<TDocument>,
    options: QueryOptions = {},
  ) {
    const document = await this.model.findOneAndUpdate(filterQuery, update, {
      lean: true,
      new: true,
      ...options,
    });

    if (!document) {
      this.logger.warn(`Document not found with filterQuery:`, filterQuery);
    }

    return document as TDocument;
  }

  async upsert(
    filterQuery: FilterQuery<TDocument> = {},
    document: Partial<TDocument>,
  ): Promise<TDocument | null> {
    return this.model.findOneAndUpdate(filterQuery, document, {
      lean: true,
      upsert: true,
      new: true,
    }) as unknown as TDocument | null;
  }

  async aggregate(pipeline: PipelineStage[] = []): Promise<any[]> {
    return this.model.aggregate(pipeline);
  }

  async update(
    filterQuery: FilterQuery<TDocument> = {},
    update: UpdateQuery<TDocument>,
  ): Promise<TDocument> {
    const document = await this.model.findOneAndUpdate(filterQuery, update, {
      lean: true,
      new: true,
    });

    if (!document) {
      this.logger.warn(`Document not found with filterQuery:`, filterQuery);
    }

    return document as TDocument;
  }

  async deleteOne(filterQuery: FilterQuery<TDocument> = {}): Promise<void> {
    const result = await this.model.deleteOne(filterQuery).exec();
    if (result.deletedCount === 0) {
      this.logger.warn(
        `No document found to delete with filterQuery:`,
        filterQuery,
      );
    }
  }

  async deleteMany(filterQuery: FilterQuery<TDocument> = {}): Promise<void> {
    const result = await this.model.deleteMany(filterQuery).exec();
    if (result.deletedCount === 0) {
      this.logger.warn(
        `No document found to delete with filterQuery:`,
        filterQuery,
      );
    }
  }

  async countDocuments(
    filterQuery: FilterQuery<TDocument> = {},
  ): Promise<number> {
    return this.model.countDocuments(filterQuery).exec();
  }

  async exists(filterQuery: FilterQuery<TDocument> = {}): Promise<boolean> {
    const document = await this.model.exists(filterQuery).lean();
    return !!document;
  }

  async startTransaction() {
    const session = await this.connection.startSession();
    session.startTransaction();

    return session;
  }
}
