import { Module } from '@nestjs/common';
import { CollaborationRequestController } from './collaboration-request.controller';
import { CollaborationRequestService } from './collaboration-request.service';
import { Board, BoardRepository, BoardSchema } from 'src/database/board';
import { BoardService } from 'src/board';
import {
  CollaborationRequest,
  CollaborationRequestRepository,
  CollaborationRequestSchema,
} from 'src/database/collaboration-request';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CollaborationRequest.name, schema: CollaborationRequestSchema },
      { name: Board.name, schema: BoardSchema },
    ]),
  ],
  controllers: [CollaborationRequestController],
  providers: [
    CollaborationRequestService,
    CollaborationRequestRepository,
    BoardRepository,
    BoardService,
  ],
})
export class CollaborationRequestModule {}
