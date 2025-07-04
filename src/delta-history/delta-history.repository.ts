import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/database';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { DeltaHistory } from './schema';

@Injectable()
export class DeltaHistoryRepository extends AbstractRepository<DeltaHistory> {
  protected readonly logger = new Logger(DeltaHistoryRepository.name);

  constructor(
    @InjectModel(DeltaHistory.name) userModel: Model<DeltaHistory>,
    @InjectConnection() connection: Connection,
  ) {
    super(userModel, connection);
  }
}
