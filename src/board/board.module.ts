import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Board, BoardRepository, BoardSchema } from 'src/database/board';
import { BoardGateway } from './board.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Board.name, schema: BoardSchema }]),
  ],
  controllers: [BoardController],
  providers: [BoardService, BoardRepository, BoardGateway],
})
export class BoardModule {}
