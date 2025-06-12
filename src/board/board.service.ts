import { Model, Types } from 'mongoose';
import { Injectable, NotFoundException, UseInterceptors } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  Board,
  Collaborator,
  CollaborationRequest,
  BoardMetadata,
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
  ) {}

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

  async findBoard(id: string): Promise<Board> {
    // Querying board from database with id
    const board = await this.boardModel.findById({
      _id: new Types.ObjectId(id),
    });

    // Checking if the board exist or not
    if (!board) {
      throw new NotFoundException('board does not exist');
    }

    return board as Board; // return the board
  }

  async createBoard(userId: string, fields: CreateBoardDto): Promise<Board> {
    // create a new board
    const board = await this.boardModel.create({
      ownerId: new Types.ObjectId(userId),
      ...fields,
      shapes: [],
      collaborators: [],
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

  async getBoardsMetadata(userId: string) {
    // Get board metadata
    const boardMetadatas = await this.boardMetadataModel.find({
      ownerId: new Types.ObjectId(userId),
    });

    console.log(boardMetadatas);

    // Chekcing if empty
    if (!boardMetadatas.length) {
      throw new NotFoundException('no boards found');
    }

    return boardMetadatas;
  }
}
