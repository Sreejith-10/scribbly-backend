import { Types } from 'mongoose';
import { Board } from 'src/database/board';
import { BoardRepository } from './../database/board';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

@Injectable()
export class BoardService {
  constructor(private readonly boardRespository: BoardRepository) {}

  async findBoard(id: string): Promise<Board> {
    // Querying board from database with id
    const board = await this.boardRespository.findOne({
      _id: id,
    });

    // Checking if the board exist or not
    if (!board) {
      throw new NotFoundException('board does not exist');
    }

    return board; // return the board
  }

  async createBoard(uId: Types.ObjectId, title: string): Promise<Board> {
    // create a new board
    return await this.boardRespository.create({
      ownerId: uId,
      title,
      shapes: [],
      accessMode: 'private',
      publicShareLink: crypto.randomUUID(),
      collaborators: [],
      collaborationRequests: [],
    });
  }

  async requestCollaboration(
    userId: Types.ObjectId,
    link: string,
  ): Promise<Board> {
    // Find the board from database
    const board = await this.boardRespository.findOne({
      publicShareLink: link,
    });

    // Checking if the board exist or not
    if (!board) {
      throw new NotFoundException('board does not exist');
    }

    // Checking if the user already requested for collaboration
    if (board.collaborationRequests.find((req) => req.user === userId)) {
      throw new ConflictException('already requested');
    }
    // Creating a new request for collaboration
    const request = await this.boardRespository.findOneAndUpdate(
      { publicShareLink: link },
      {
        $push: { collaborationRequests: { user: userId } },
      },
    );

    return request;
  }

  async getCollaborationRequests(boardId: string): Promise<
    {
      user: Types.ObjectId;
      status: 'pending' | 'accepted' | 'rejected';
      requestedAt: Date;
    }[]
  > {
    // Finding the board from database
    const board = await this.boardRespository.findOne({ _id: boardId });

    // Checking if the board exist
    if (!board) {
      throw new NotFoundException('board does not exist');
    }

    return board.collaborationRequests; // Returns the collaboration requests
  }

  async acceptCollaborationRequest(
    boardId: Types.ObjectId,
    requestedUserId: Types.ObjectId,
  ): Promise<Board> {
    // Finding the board from database
    const board = await this.boardRespository.findOne({ _id: boardId });

    // Checking if the board exist
    if (!board) {
      throw new NotFoundException('board does not exist');
    }

    // Checking if the request exist
    const requsestExist = board.collaborationRequests.find(
      (req) => req.user === requestedUserId,
    );

    // If not throw error
    if (!requsestExist) {
      throw new NotFoundException('request does not exist');
    }

    // Updating the request status
    const acceptedRequest = await this.boardRespository.findOneAndUpdate(
      { _id: boardId, 'collaborationRequests.user': requestedUserId },
      {
        $set: { 'collaborationRequests.$.status': 'accepted' },
      },
    );

    return acceptedRequest;
  }

  async rejectCollaborationRequest(
    boardId: Types.ObjectId,
    requestedUserId: Types.ObjectId,
  ): Promise<Board> {
    // Finding the board from database
    const board = await this.boardRespository.findOne({ _id: boardId });

    // Checking if the board exist
    if (!board) {
      throw new NotFoundException('board does not exist');
    }

    // Checking if the user is requested for collaboration
    const requsestExist = board.collaborationRequests.find(
      (req) => req.user === requestedUserId,
    );

    if (!requsestExist) {
      throw new NotFoundException('request does not exist');
    }

    // Updating the request status
    const rejectedRequest = await this.boardRespository.findOneAndUpdate(
      { _id: boardId, 'collaborationRequests.user': requestedUserId },
      {
        $pull: {
          collaborationRequests: {
            user: requestedUserId,
          },
        },
      },
    );

    return rejectedRequest;
  }
}
