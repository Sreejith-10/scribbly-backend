import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CollborationRequestRepository } from './collaboration-reqest.repository';
import { CollaborationRequest } from './schema';
import { BoardService } from 'src/board';
import { BoardMetadataService } from 'src/board-metadata';
import { CollaboratorService } from 'src/collaborator';

@Injectable()
export class CollaborationRequestService {
  constructor(
    private readonly collaborationRequestRespository: CollborationRequestRepository,
    @Inject(forwardRef(() => BoardService))
    private readonly boardService: BoardService,
    private readonly boardMetadataService: BoardMetadataService,
    private readonly collaboratorService: CollaboratorService,
  ) {}

  async getCollaborationRequestsByBoardId(
    boardId: string,
  ): Promise<CollaborationRequest[]> {
    // Query request document from database
    const requests = await this.collaborationRequestRespository.find({
      boardId: new Types.ObjectId(boardId),
      status: 'pending',
    });

    return requests; // return the results
  }

  async requestCollaboration(userId: string, boardId: string): Promise<any> {
    // Find the board from database
    const board = await this.boardService.findBoard(boardId);

    // Checking if the board exist or not
    if (!board) {
      throw new NotFoundException('board does not exist');
    }

    // Checking if the user already requested
    const alreadyRequested = await this.collaborationRequestRespository.findOne(
      {
        boardId: board._id,
        userId: new Types.ObjectId(userId),
      },
    );

    // Checking if the user already requested for collaboration
    if (alreadyRequested) {
      throw new ConflictException('already requested');
    }
    // Creating a new request for collaboration
    const newRequest = await this.collaborationRequestRespository.create({
      boardId: new Types.ObjectId(boardId),
      userId: new Types.ObjectId(userId),
    });
    await this.boardMetadataService.updateBoardMetada(boardId, {
      collaborators: [new Types.ObjectId(userId)],
    });

    return newRequest;
  }

  async acceptCollaborationRequest(
    boardId: string,
    requestedUserId: string,
  ): Promise<CollaborationRequest> {
    // Finding the request from database
    const request = await this.collaborationRequestRespository.findOne({
      boardId: new Types.ObjectId(boardId),
      userId: new Types.ObjectId(requestedUserId),
    });

    // Checking if the board exist
    if (!request) {
      throw new NotFoundException('request does not exist');
    }

    if (request.status === 'accepted') {
      throw new BadRequestException('request already accepted');
    }

    if (request.status === 'rejected') {
      throw new BadRequestException('request is rejected');
    }
    // Updating the request status
    const acceptedRequest =
      await this.collaborationRequestRespository.findOneAndUpdate(
        {
          boardId: new Types.ObjectId(boardId),
          userId: new Types.ObjectId(requestedUserId),
        },
        {
          $set: { status: 'accepted' },
        },
      );

    // add the user to collaborator collection
    await this.collaboratorService.addCollaborator({
      boardId: new Types.ObjectId(boardId),
      userId: new Types.ObjectId(requestedUserId),
    });

    // update the user in board collection
    await this.boardService.addCollaborator(boardId, requestedUserId);

    return acceptedRequest;
  }

  async rejectCollaborationRequest(
    boardId: string,
    requestedUserId: string,
  ): Promise<CollaborationRequest> {
    // Finding the request from database
    const request = await this.collaborationRequestRespository.findOne({
      boardId: new Types.ObjectId(boardId),
      userId: new Types.ObjectId(requestedUserId),
    });

    // Checking if the board exist
    if (!request) {
      throw new NotFoundException('request does not exist');
    }

    // Updating the request status
    const acceptedRequest =
      await this.collaborationRequestRespository.findOneAndUpdate(
        {
          boardId: new Types.ObjectId(boardId),
          userId: new Types.ObjectId(requestedUserId),
        },
        {
          $set: { status: 'rejected' },
        },
      );

    return acceptedRequest;
  }

  async dropAllRequests(boardId: string): Promise<void> {
    return this.collaborationRequestRespository.deleteMany({ boardId });
  }
}
