import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { BoardRepository } from 'src/database/board';
import {
  CollaborationRequestRepository,
  CollaborationRequest,
} from 'src/database/collaboration-request';

@Injectable()
export class CollaborationRequestService {
  constructor(
    private readonly collaborationRequestRespository: CollaborationRequestRepository,
    private readonly boardRepository: BoardRepository,
  ) {}

  async getCollaborationRequests(
    boardId: string,
  ): Promise<CollaborationRequest[]> {
    // Query request document from database
    const requests = await this.collaborationRequestRespository.find({
      boardId,
    });

    return requests; // return the results
  }

  async requestCollaboration(
    userId: Types.ObjectId,
    boardId: string,
  ): Promise<any> {
    // Find the board from database
    const board = await this.boardRepository.findOne({ _id: boardId });

    // Checking if the board exist or not
    if (!board) {
      throw new NotFoundException('board does not exist');
    }

    // Checking if the user already requested
    const alreadyRequested = await this.collaborationRequestRespository.findOne(
      { boardId: board._id, userId },
    );

    // Checking if the user already requested for collaboration
    if (alreadyRequested) {
      throw new ConflictException('already requested');
    }
    // Creating a new request for collaboration
    const newRequest = await this.collaborationRequestRespository.create({
      boardId: new Types.ObjectId(boardId),
      userId,
    });

    return newRequest;
  }

  async acceptCollaborationRequest(
    boardId: string,
    requestedUserId: string,
  ): Promise<CollaborationRequest> {
    // Finding the request from database
    const request = await this.collaborationRequestRespository.findOne({
      boardId,
      userId: requestedUserId,
    });

    // Checking if the board exist
    if (!request) {
      throw new NotFoundException('request does not exist');
    }

    // Updating the request status
    const acceptedRequest =
      await this.collaborationRequestRespository.findOneAndUpdate(
        {
          boardId,
          userId: requestedUserId,
        },
        {
          $set: { status: 'accepted' },
        },
      );

    return acceptedRequest;
  }

  async rejectCollaborationRequest(
    boardId: string,
    requestedUserId: string,
  ): Promise<CollaborationRequest> {
    // Finding the request from database
    const request = await this.collaborationRequestRespository.findOne({
      boardId,
      userId: requestedUserId,
    });

    // Checking if the board exist
    if (!request) {
      throw new NotFoundException('request does not exist');
    }

    // Updating the request status
    const acceptedRequest =
      await this.collaborationRequestRespository.findOneAndUpdate(
        {
          boardId,
          userId: requestedUserId,
        },
        {
          $set: { status: 'rejected' },
        },
      );

    return acceptedRequest;
  }
}
