import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/database';
import { Auth } from './auth.schema';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';

@Injectable()
export class AuthRepository extends AbstractRepository<Auth> {
  protected readonly logger = new Logger(AuthRepository.name);

  constructor(
    @InjectModel(Auth.name) authModel: Model<Auth>,
    @InjectConnection() connection: Connection,
  ) {
    super(authModel, connection);
  }
}
