import { Connection, Model } from 'mongoose';
import { AbstractRepository } from 'src/database';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { BoardMetadata } from './schema';

@Injectable()
export class BoardMetedataRepository extends AbstractRepository<BoardMetadata> {
  protected readonly logger = new Logger(BoardMetedataRepository.name);

  constructor(
    @InjectModel(BoardMetadata.name) userModel: Model<BoardMetadata>,
    @InjectConnection() connection: Connection,
  ) {
    super(userModel, connection);
  }
}
