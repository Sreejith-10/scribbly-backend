import { Module } from '@nestjs/common';
import { CollaboratorService } from './collaborator.service';
import { CollaboratorController } from './collaborator.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Collaborator, CollaboratorSchema } from 'src/collaborator/schema';
import { CollaboratorRespository } from './collaborator.respository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collaborator.name, schema: CollaboratorSchema },
    ]),
  ],
  controllers: [CollaboratorController],
  providers: [CollaboratorService, CollaboratorRespository],
  exports: [CollaboratorService, CollaboratorRespository],
})
export class CollaboratorModule {}
