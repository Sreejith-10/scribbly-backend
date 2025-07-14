import { Injectable, NotFoundException, UseInterceptors } from '@nestjs/common';
import { Collaborator } from './schema';
import { CatchErrorsInterceptor } from 'src/common/interceptor';
import { CollaboratorRespository } from './collaborator.respository';
import { Types } from 'mongoose';

@UseInterceptors(CatchErrorsInterceptor)
@Injectable()
export class CollaboratorService {
  constructor(
    private readonly collaboratorReposiotry: CollaboratorRespository,
  ) {}

  async getCollaborators(): Promise<Collaborator[]> {
    return this.collaboratorReposiotry.find();
  }

  async getCollaboratorsByBoardId(boardId: string): Promise<Collaborator[]> {
    const collaborators = await this.collaboratorReposiotry.aggregate([
      {
        $match: {
          boardId: new Types.ObjectId(boardId),
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'userId',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: {
          path: '$user',
        },
      },
      {
        $project: {
          owner: { password: 0, hashRt: 0 },
        },
      },
    ]);

    if (!collaborators.length) {
      throw new NotFoundException('collaborator does not exist');
    }

    return collaborators;
  }

  async getCollaboratorByUserId(
    boardId: string,
    userId: string,
  ): Promise<Collaborator> {
    const collaborator = await this.collaboratorReposiotry.findOne({
      boardId: new Types.ObjectId(boardId),
      userId: new Types.ObjectId(userId),
    });

    if (!collaborator) {
      throw new NotFoundException('collaborator does not exist');
    }

    return collaborator;
  }

  async addCollaborator(dto: Omit<Collaborator, '_id'>): Promise<Collaborator> {
    return this.collaboratorReposiotry.create({ ...dto });
  }

  async updateCollaboratorRole(
    boardId: string,
    userId: string,
    role: 'edit' | 'view',
  ): Promise<Collaborator> {
    return this.collaboratorReposiotry.findOneAndUpdate(
      {
        boardId: new Types.ObjectId(boardId),
        userId: new Types.ObjectId(userId),
      },
      { role },
    );
  }

  async removeCollaborator(boardId: string, userId: string) {
    return this.collaboratorReposiotry.deleteOne({
      boardId: new Types.ObjectId(boardId),
      userId: new Types.ObjectId(userId),
    });
  }

  async removeAllCollaborator(boardId: string) {
    return this.collaboratorReposiotry.deleteMany({
      boardId: new Types.ObjectId(boardId),
    });
  }

  async updateCollaboratorStatus(
    boardId: string,
    userId: string,
    status: string,
  ) {
    this.collaboratorReposiotry.findOneAndUpdate(
      {
        boardId: new Types.ObjectId(boardId),
        userId: new Types.ObjectId(userId),
      },
      {
        status,
      },
    );
  }
}
