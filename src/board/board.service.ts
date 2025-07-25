import { Types } from 'mongoose';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
  UseInterceptors,
} from '@nestjs/common';
import { CatchErrorsInterceptor } from 'src/common/interceptor';
import { CreateBoardDto } from './dto';
import { BoardRepository } from './board.repository';
import { BoardMetadataService } from 'src/board-metadata';
import { Board } from './schema';
import { CollaboratorService } from 'src/collaborator';
import { DeltaHistoryService } from 'src/delta-history';
import { CollaborationRequestService } from 'src/collaboration-request';

@UseInterceptors(CatchErrorsInterceptor)
@Injectable()
export class BoardService {
  constructor(
    private readonly boardRespository: BoardRepository,
    private readonly boardMetadataService: BoardMetadataService,
    private readonly collaboratorService: CollaboratorService,
    private readonly deltaHistoryService: DeltaHistoryService,
    @Inject(forwardRef(() => CollaborationRequestService))
    private readonly collaborationRequestService: CollaborationRequestService,
  ) {}

  async getBoards(userId: string): Promise<Board[]> {
    const boards = await this.boardRespository.aggregate([
      {
        $match: {
          $or: [
            { ownerId: new Types.ObjectId(userId) },
            { collaborators: new Types.ObjectId(userId) },
          ],
        },
      },
      {
        $project: {
          title: 1,
          accessMode: 1,
          ownerId: 1,
          collaborators: 1,
          shapes: 1,
        },
      },
    ]);

    if (!boards.length) {
      throw new NotFoundException('no boards found');
    }

    return boards;
  }

  async findBoard(id: string): Promise<any> {
    // Querying board from database with id
    const board = await this.boardRespository.aggregate([
      {
        $match: {
          _id: new Types.ObjectId(id),
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
    ]);

    // Checking if the board exist or not
    if (!board) {
      throw new NotFoundException('board does not exist');
    }

    return board[0]; // return the board
  }

  async createBoard(userId: string, fields: CreateBoardDto): Promise<Board> {
    // create a new board
    const board = await this.boardRespository.create({
      ownerId: new Types.ObjectId(userId),
      ...fields,
      snapshot: { shapes: {}, version: 0 },
      deltas: [],
      collaborators: [],
      sequence: 0,
    });

    await this.boardMetadataService.createBoardMetadata({
      ownerId: new Types.ObjectId(userId),
      boardId: board._id,
      title: fields.title,
      accessMode: fields.accessMode,
      description: fields.description ?? null,
      boardCreatedAt: new Date(),
    });

    return board;
  }

  async deleteBoard(boardId: string) {
    await this.collaboratorService.removeAllCollaborator(boardId);
    await this.collaborationRequestService.dropAllRequests(boardId);
    await this.boardRespository.deleteMany({ _id: boardId });
  }

  async addDelta(
    boardId: string,
    delta: {
      operation: 'create' | 'update' | 'delete' | 'move';
      shapeId: string;
      data?: any;
    },
    userId: string,
  ) {
    const board = await this.boardRespository.findOneAndUpdate(
      {
        _id: new Types.ObjectId(boardId),
      },
      {
        $push: {
          deltas: {
            ...delta,
            author: new Types.ObjectId(userId),
            sequence: await this.getNextSequence(boardId),
            timestamp: new Date(),
          },
        },
        $inc: { sequence: 1 },
      },
      {
        new: true,
      },
    );

    await Promise.all([
      this.deltaHistoryService.createHistory(boardId, userId, delta),
      this.boardMetadataService.updateBoardMetada(boardId, {
        lastUpdatedAt: new Date(),
        lastUpdatedBy: new Types.ObjectId(userId),
      }),
    ]);
    return this.computeCurrentState(board);
  }

  private async getNextSequence(boardId: string) {
    const id = new Types.ObjectId(boardId);
    const board = await this.boardRespository.findById(id);
    if (!board) {
      throw new NotFoundException('Board does not exist');
    }

    return board.sequence + 1;
  }

  async createSnapshot(boardId: string) {
    const board = await this.boardRespository.findById(boardId);
    if (!board) {
      throw new NotFoundException('Board does not exist');
    }

    const currentState = await this.computeCurrentState(board);

    return this.boardRespository.findOneAndUpdate(
      { _id: boardId },
      {
        snapshot: {
          shapes: currentState,
          version: board.sequence,
        },
        deltas: [],
      },
      { new: true },
    );
  }

  private async computeCurrentState(board: Board) {
    const state = JSON.parse(JSON.stringify(board.snapshot.shapes || {}));

    board.deltas
      .filter((a) => a.sequence <= board.sequence)
      .sort((a, b) => a.sequence - b.sequence)
      .forEach((delta) => {
        switch (delta.operation) {
          case 'create':
            state[delta.shapeId] = {
              ...delta.data,
              shapeId: delta.shapeId,
            };
            break;
          case 'update':
            if (state[delta.shapeId]) {
              state[delta.shapeId] = {
                ...state[delta.shapeId],
                ...delta.data,
              };
            }
            break;
          case 'delete':
            delete state[delta.shapeId];
            break;
        }
      });

    return state;
  }

  async getBoardState(boardId: string) {
    const board = await this.boardRespository.findById(boardId);
    if (!board) {
      throw new NotFoundException('Board does not exist');
    }

    return {
      snapshot: board.snapshot,
      deltas: board.deltas,
      currentState: await this.computeCurrentState(board),
    };
  }

  async getLastUserDelta(boardId: string, userId: string) {
    const board = await this.boardRespository.findOne({
      _id: boardId,
      'deltas.author': new Types.ObjectId(userId),
    });

    return board?.deltas?.slice(-1)[0];
  }

  async addCollaborator(boardId: string, userId: string) {
    const id = new Types.ObjectId(userId);
    return this.boardRespository.findOneAndUpdate(
      { _id: new Types.ObjectId(boardId) },
      { $push: { collaborators: id } },
    );
  }

  async removeCollaborator(boardId: string, userId: string) {
    return this.boardRespository.findOneAndUpdate(
      { _id: new Types.ObjectId(boardId) },
      { $pull: { collaborators: new Types.ObjectId(userId) } },
    );
  }

  async resetBoard(boardId: string) {
    const boardExist = await this.boardRespository.exists({
      _id: new Types.ObjectId(boardId),
    });

    if (!boardExist) {
      throw new NotFoundException('board does not exist');
    }

    return this.boardRespository.findOneAndUpdate(
      { _id: new Types.ObjectId(boardId) },
      {
        snapshot: {
          shapes: {},
          version: 0,
        },
        deltas: [],
        sequence: 0,
      },
    );
  }

  async undoLastAction(boardId: string) {
    const board = await this.boardRespository.findById(boardId);

    if (!board) {
      throw new NotFoundException('board does not exist');
    }

    const lastDelta = board.deltas.find((a) => a.sequence === board.sequence);

    if (!lastDelta || lastDelta.sequence < 1) {
      throw new BadRequestException('nothing to undo');
    }

    await this.boardRespository.findOneAndUpdate(
      { _id: new Types.ObjectId(boardId) },
      {
        $set: {
          sequence: board.sequence - 1,
        },
      },
    );

    return lastDelta;
  }

  async redoLastAction(boardId: string) {
    const board = await this.boardRespository.findById(boardId);

    if (!board) {
      throw new NotFoundException('board does not exist');
    }

    const lastDelta = board.deltas[board.deltas.length - 1];

    if (!lastDelta || lastDelta.sequence === board.sequence) {
      throw new BadRequestException('nothing to redo');
    }

    await this.boardRespository.findOneAndUpdate(
      { _id: new Types.ObjectId(boardId) },
      {
        $set: {
          sequence: board.sequence + 1,
        },
      },
    );

    return lastDelta;
  }

  private inverseDelta(delta: any) {
    switch (delta.operation) {
      case 'create':
        return { ...delta, operation: 'delete' };
      case 'delete':
        return { ...delta, operation: 'create', data: delta.data };
      case 'update':
        return { ...delta, data: delta.previousData };
    }
  }
}
