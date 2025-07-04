import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/database';
import { Collaborator } from './schema';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

@Injectable()
export class CollaboratorRespository extends AbstractRepository<Collaborator> {
  protected readonly logger = new Logger(CollaboratorRespository.name);

  constructor(
    @InjectModel(Collaborator.name) userModel: Model<Collaborator>,
    @InjectConnection() connection: Connection,
  ) {
    super(userModel, connection);
  }
}
