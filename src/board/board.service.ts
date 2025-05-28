import { Model, Types } from 'mongoose';
import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Board, Collaborator, CollaborationRequest } from 'src/database/schema';

@Injectable()
export class BoardService {
  constructor(
    @InjectModel(Board.name) private readonly boardModel: Model<Board>,
    @InjectModel(Collaborator.name)
    private readonly collaboratorModel: Model<Collaborator>,
    @InjectModel(CollaborationRequest.name)
    private readonly collaborationRequestModel: Model<CollaborationRequest>,
  ) {}

  async findBoard(id: string): Promise<Board> {
    // Querying board from database with id
    const board = await this.boardModel.findOne({
      _id: id,
    });

    // Checking if the board exist or not
    if (!board) {
      throw new NotFoundException('board does not exist');
    }

    return board as Board; // return the board
  }

  async createBoard(uId: string, title: string): Promise<Board> {
    // create a new board
    return await this.boardModel.create({
      ownerId: new Types.ObjectId(uId),
      title,
      shapes: [],
      accessMode: 'private',
      collaborators: [],
    });
  }

  async deleteBoard(boardId: string) {
    try {
      await this.collaboratorModel.deleteMany({ boardId });
      await this.collaborationRequestModel.deleteMany({ boardId });
      await this.boardModel.deleteMany({ _id: boardId });
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}
