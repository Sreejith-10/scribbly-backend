import { Injectable, NotFoundException } from '@nestjs/common';
import { BoardMetedataRepository } from './board-metedata.repository';
import { Types } from 'mongoose';
import { BoardMetadata } from './schema';

@Injectable()
export class BoardMetadataService {
  constructor(
    private readonly boardMetadataRespository: BoardMetedataRepository,
  ) {}

  async getBoardsMetadata(userId: string, query: string) {
    // Get board metadata
    const boardMetadatas = await this.boardMetadataRespository.aggregate([
      {
        $match: {
          $or: [
            { ownerId: new Types.ObjectId(userId) },
            { collaborators: new Types.ObjectId(userId) },
          ],
        },
      },
      {
        $match: query === 'all' ? {} : { accessMode: query },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          as: 'owner',
        },
      },
      {
        $unwind: {
          path: '$owner',
        },
      },
      {
        $project: {
          owner: { password: 0, hashRt: 0 },
        },
      },
    ]);

    // Chekcing if empty
    if (!boardMetadatas.length) {
      throw new NotFoundException('no boards found');
    }

    return boardMetadatas;
  }

  async getBoardMetadataBoardById(boardId: string) {
    // Get board metadata
    const boardMetadata = await this.boardMetadataRespository.aggregate([
      {
        $match: {
          boardId: new Types.ObjectId(boardId),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'ownerId',
          foreignField: '_id',
          as: 'owner',
        },
      },
      {
        $unwind: {
          path: '$owner',
        },
      },
      {
        $project: {
          owner: { password: 0, hashRt: 0 },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'collaborators',
          foreignField: '_id',
          as: 'collaborators',
        },
      },
      {
        $project: {
          collaborators: { password: 0, hashRt: 0 },
        },
      },
      {
        $limit: 1,
      },
    ]);

    // Chekcing if empty
    if (!boardMetadata[0]) {
      throw new NotFoundException('no boards found');
    }

    return boardMetadata[0];
  }

  async createBoardMetadata(
    dto: Omit<BoardMetadata, '_id' | 'collaborators'>,
  ): Promise<BoardMetadata> {
    return this.boardMetadataRespository.create({
      ...dto,
      description: dto.description ?? null,
      collaborators: [],
      boardThumbnail: null,
      boardCreatedAt: new Date(),
    });
  }

  async updateBoardMetada(
    boardId: string,
    dto: Partial<BoardMetadata>,
  ): Promise<BoardMetadata> {
    return this.boardMetadataRespository.findOneAndUpdate(
      { boardId },
      {
        ...dto,
      },
    );
  }

  async deleteBoardMetada(boardId: string) {
    return this.boardMetadataRespository.deleteOne({ boardId });
  }

  async addCollaborator(boardId: string, userId: string) {
    return this.boardMetadataRespository.findOneAndUpdate(
      { boardId: new Types.ObjectId(boardId) },
      { $push: { collaborators: new Types.ObjectId(userId) } },
    );
  }
}
