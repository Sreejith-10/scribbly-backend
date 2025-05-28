import { Module } from '@nestjs/common';
import { CollaborationRequestController } from './collaboration-request.controller';
import { CollaborationRequestService } from './collaboration-request.service';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Board,
  BoardSchema,
  CollaborationRequest,
  CollaborationRequestSchema,
  Collaborator,
  CollaboratorSchema,
} from 'src/database/schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CollaborationRequest.name, schema: CollaborationRequestSchema },
      { name: Board.name, schema: BoardSchema },
      { name: Collaborator.name, schema: CollaboratorSchema },
    ]),
  ],
  controllers: [CollaborationRequestController],
  providers: [CollaborationRequestService],
})
export class CollaborationRequestModule {}
