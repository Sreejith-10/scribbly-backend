import { Connection, Model } from 'mongoose';
import { AbstractRepository } from 'src/database';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { CollaborationRequest } from './schema';

@Injectable()
export class CollborationRequestRepository extends AbstractRepository<CollaborationRequest> {
  protected readonly logger = new Logger(CollaborationRequest.name);

  constructor(
    @InjectModel(CollaborationRequest.name)
    userModel: Model<CollaborationRequest>,
    @InjectConnection() connection: Connection,
  ) {
    super(userModel, connection);
  }
}
