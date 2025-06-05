import { Module } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Board,
  BoardMetadata,
  BoardMetadataSchema,
  BoardSchema,
  CollaborationRequest,
  CollaborationRequestSchema,
  Collaborator,
  CollaboratorSchema,
} from 'src/database/schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: CollaborationRequest.name, schema: CollaborationRequestSchema },
      { name: Collaborator.name, schema: CollaboratorSchema },
      { name: BoardMetadata.name, schema: BoardMetadataSchema },
    ]),
  ],
  controllers: [BoardController],
  providers: [BoardService],
})
export class BoardModule {}
