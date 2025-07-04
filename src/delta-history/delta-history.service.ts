import { Injectable } from '@nestjs/common';
import { DeltaHistoryRepository } from './delta-history.repository';
import { DeltaHistory } from './schema';
import { Types } from 'mongoose';

@Injectable()
export class DeltaHistoryService {
  constructor(
    private readonly deletaHistoryRespository: DeltaHistoryRepository,
  ) {}

  async createHistory(
    boardId: string,
    userId: string,
    delta: any,
  ): Promise<DeltaHistory> {
    return this.deletaHistoryRespository.create({
      author: new Types.ObjectId(userId),
      boardId: new Types.ObjectId(boardId),
      delta,
    });
  }
}
