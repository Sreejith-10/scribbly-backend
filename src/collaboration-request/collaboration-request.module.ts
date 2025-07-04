import { forwardRef, Module } from '@nestjs/common';
import { CollaborationRequestController } from './collaboration-request.controller';
import { CollaborationRequestService } from './collaboration-request.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CollaborationRequest, CollaborationRequestSchema } from './schema';
import { Board, BoardSchema } from 'src/board/schema';
import { Collaborator, CollaboratorSchema } from 'src/collaborator/schema';
import { BoardMetadata, BoardMetadataSchema } from 'src/board-metadata/schema';
import { CollborationRequestRepository } from './collaboration-reqest.repository';
import { BoardModule } from 'src/board';
import { CollaboratorModule } from 'src/collaborator';
import { BoardMetadataModule } from 'src/board-metadata';

@Module({
  imports: [
    forwardRef(() => BoardModule),
    MongooseModule.forFeature([
      { name: Board.name, schema: BoardSchema },
      { name: CollaborationRequest.name, schema: CollaborationRequestSchema },
      { name: Collaborator.name, schema: CollaboratorSchema },
      { name: BoardMetadata.name, schema: BoardMetadataSchema },
    ]),
    CollaboratorModule,
    BoardMetadataModule,
  ],
  controllers: [CollaborationRequestController],
  providers: [CollaborationRequestService, CollborationRequestRepository],
  exports: [CollaborationRequestService, CollborationRequestRepository],
})
export class CollaborationRequestModule {}
