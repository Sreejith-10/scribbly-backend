import { Model, Types } from 'mongoose';
import { Injectable, NotFoundException, UseInterceptors } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Board,
  Collaborator,
  CollaborationRequest,
  BoardMetadata,
  DelataHistory,
} from 'src/database/schema';
import { CatchErrorsInterceptor } from 'src/common/interceptor';
import { CreateBoardDto } from './dto';

@UseInterceptors(CatchErrorsInterceptor)
@Injectable()
export class BoardService {
  constructor(
    @InjectModel(Board.name) private readonly boardModel: Model<Board>,
    @InjectModel(Collaborator.name)
    private readonly collaboratorModel: Model<Collaborator>,
    @InjectModel(CollaborationRequest.name)
    private readonly collaborationRequestModel: Model<CollaborationRequest>,
    @InjectModel(BoardMetadata.name)
    private readonly boardMetadataModel: Model<BoardMetadata>,
    @InjectModel(DelataHistory.name)
    private readonly deltaHistoryModel: Model<DelataHistory>,
  ) { }

  async getBoards(userId: string): Promise<Board[]> {
    const boards = await this.boardModel.aggregate([
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
    const board = await this.boardModel.aggregate([
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
    const board = await this.boardModel.create({
      ownerId: new Types.ObjectId(userId),
      ...fields,
      snapshot: { shapes: {}, version: 0 },
      deltas: [],
      sequence: 0,
    });

    await this.boardMetadataModel.create({
      ownerId: new Types.ObjectId(userId),
      boardId: board._id,
      title: fields.title,
      accessMode: fields.accessMode,
      description: fields.description ?? null,
    });

    return board;
  }

  async deleteBoard(boardId: string) {
    await this.collaboratorModel.deleteMany({ boardId });
    await this.collaborationRequestModel.deleteMany({ boardId });
    await this.boardModel.deleteMany({ _id: boardId });
  }

  async getBoardsMetadata(userId: string, query: string) {
    // Get board metadata
    const boardMetadatas = await this.boardMetadataModel.aggregate([
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

  async addDelta(
    boardId: string,
    delta: {
      operation: 'create' | 'update' | 'delete';
      shapeId: string;
      data?: any;
    },
    userId: string,
  ) {
    const board = await this.boardModel.findByIdAndUpdate(
      boardId,
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

    await this.deltaHistoryModel.create({
      boardId: new Types.ObjectId(boardId),
      delta,
      author: new Types.ObjectId(userId),
    });

    return this.computeCurrentState(board);
  }

  private async getNextSequence(boardId: string) {
    const board = await this.boardModel.findById(boardId);
    if (!board) {
      throw new NotFoundException('Board does not exist');
    }

    return board.sequence + 1;
  }

  async createSnapshot(boardId: string) {
    const board = await this.boardModel.findById(boardId);
    if (!board) {
      throw new NotFoundException('Board does not exist');
    }

    const currentState = await this.computeCurrentState(board);

    return this.boardModel.findOneAndUpdate(
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
    const board = await this.boardModel.findById(boardId);
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
    const board = await this.boardModel.findOne({
      _id: boardId,
      'deltas.author': new Types.ObjectId(userId),
    });

    return board?.deltas?.slice(-1)[0];
  }

  async getBoardMetadataById(boardId: string) {
    // Get board metadata
    const boardMetadata = await this.boardMetadataModel.aggregate([
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
}
