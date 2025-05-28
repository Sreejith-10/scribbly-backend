import { Module } from '@nestjs/common';
import { CollaboratorService } from './collaborator.service';
import { CollaboratorController } from './collaborator.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Collaborator, CollaboratorSchema } from 'src/database/schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Collaborator.name, schema: CollaboratorSchema },
    ]),
  ],
  controllers: [CollaboratorController],
  providers: [CollaboratorService],
})
export class CollaboratorModule {}
