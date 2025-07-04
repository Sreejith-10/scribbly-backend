import { Connection, Model } from 'mongoose';
import { AbstractRepository } from 'src/database';
import { Injectable, Logger } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Board } from './schema';

@Injectable()
export class BoardRepository extends AbstractRepository<Board> {
  protected readonly logger = new Logger(BoardRepository.name);

  constructor(
    @InjectModel(Board.name) userModel: Model<Board>,
    @InjectConnection() connection: Connection,
  ) {
    super(userModel, connection);
  }
}
