import { Injectable, Logger } from '@nestjs/common';
import { AbstractRepository } from 'src/database';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model } from 'mongoose';
import { Board } from './board.schema';

@Injectable()
export class BoardRepository extends AbstractRepository<Board> {
  protected readonly logger = new Logger(BoardRepository.name);

  constructor(
    @InjectModel(Board.name) boardModel: Model<Board>,
    @InjectConnection() connection: Connection,
  ) {
    super(boardModel, connection);
  }
}
