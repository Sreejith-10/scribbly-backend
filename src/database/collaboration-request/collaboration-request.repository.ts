import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/database';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { CollaborationRequest } from './collaboration-request.schema';

@Injectable()
export class CollaborationRequestRepository extends AbstractRepository<CollaborationRequest> {
  protected readonly logger = new Logger(CollaborationRequest.name);

  constructor(
    @InjectModel(CollaborationRequest.name)
    collaborationRequstModel: Model<CollaborationRequest>,
    @InjectConnection() connection: Connection,
  ) {
    super(collaborationRequstModel, connection);
  }
}
