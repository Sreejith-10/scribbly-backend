import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/database';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Collaborator } from './collaborator.schema';

@Injectable()
export class CollaboratorRepository extends AbstractRepository<Collaborator> {
  protected readonly logger = new Logger(CollaboratorRepository.name);

  constructor(
    @InjectModel(Collaborator.name) collaboratorModel: Model<Collaborator>,
    @InjectConnection() connection: Connection,
  ) {
    super(collaboratorModel, connection);
  }
}
