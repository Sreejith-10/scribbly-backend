import { Module } from '@nestjs/common';
import { BoardMetadataService } from './board-metadata.service';
import { BoardMetadataController } from './board-metadata.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { BoardMetadata, BoardMetadataSchema } from './schema';
import { BoardMetedataRepository } from './board-metedata.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BoardMetadata.name, schema: BoardMetadataSchema },
    ]),
  ],
  controllers: [BoardMetadataController],
  providers: [BoardMetadataService, BoardMetedataRepository],
  exports: [BoardMetadataService, BoardMetedataRepository],
})
export class BoardMetadataModule {}
