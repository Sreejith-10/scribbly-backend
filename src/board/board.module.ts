import { Module, forwardRef } from '@nestjs/common';
import { BoardService } from './board.service';
import { BoardController } from './board.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardRepository } from './board.repository';
import { Board, BoardSchema } from './schema';
import {
  CollaborationRequest,
  CollaborationRequestSchema,
} from 'src/collaboration-request/schema';
import { Collaborator, CollaboratorSchema } from 'src/collaborator/schema';
import { BoardMetadata, BoardMetadataSchema } from 'src/board-metadata/schema';
import { DeltaHistory, DeltaHistorySchema } from 'src/delta-history/schema';
import { CollaborationRequestModule } from 'src/collaboration-request';
import { CollaboratorModule } from 'src/collaborator';
import { BoardMetadataModule } from 'src/board-metadata';
import { DeltaHistoryModule } from 'src/delta-history';

@Module({
  imports: [
    forwardRef(() => CollaborationRequestModule),
    forwardRef(() => CollaboratorModule),
    forwardRef(() => BoardMetadataModule),
    forwardRef(() => DeltaHistoryModule),
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: CollaborationRequest.name, schema: CollaborationRequestSchema },
      { name: Collaborator.name, schema: CollaboratorSchema },
      { name: BoardMetadata.name, schema: BoardMetadataSchema },
      { name: DeltaHistory.name, schema: DeltaHistorySchema },
    ]),
  ],
  controllers: [BoardController],
  providers: [BoardService, BoardRepository],
  exports: [BoardService, BoardRepository],
})
export class BoardModule {}
