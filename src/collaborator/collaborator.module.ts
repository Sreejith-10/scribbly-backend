import { forwardRef, Module } from '@nestjs/common';
import { CollaboratorService } from './collaborator.service';
import { CollaboratorController } from './collaborator.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Collaborator, CollaboratorSchema } from 'src/collaborator/schema';
import { CollaboratorRespository } from './collaborator.respository';
import { Board, BoardSchema } from 'src/board/schema';
import { BoardModule } from 'src/board';

@Module({
  imports: [
    forwardRef(() => BoardModule),
    MongooseModule.forFeature([
      { name: Collaborator.name, schema: CollaboratorSchema },
      { name: Board.name, schema: BoardSchema },
    ]),
  ],
  controllers: [CollaboratorController],
  providers: [CollaboratorService, CollaboratorRespository],
  exports: [CollaboratorService, CollaboratorRespository],
})
export class CollaboratorModule {}
