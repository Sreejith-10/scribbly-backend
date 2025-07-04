import { Module } from '@nestjs/common';
import { DeltaHistoryService } from './delta-history.service';
import { DeltaHistoryController } from './delta-history.controller';
import { DeltaHistoryRepository } from './delta-history.repository';
import { MongooseModule } from '@nestjs/mongoose';
import { DeltaHistory, DeltaHistorySchema } from './schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DeltaHistory.name, schema: DeltaHistorySchema },
    ]),
  ],
  controllers: [DeltaHistoryController],
  providers: [DeltaHistoryService, DeltaHistoryRepository],
  exports: [DeltaHistoryService, DeltaHistoryRepository],
})
export class DeltaHistoryModule {}
