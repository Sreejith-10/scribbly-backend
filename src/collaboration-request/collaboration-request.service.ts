import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Board,
  BoardMetadata,
  CollaborationRequest,
  Collaborator,
} from 'src/database/schema';

@Injectable()
export class CollaborationRequestService {
  constructor(
    @InjectModel(CollaborationRequest.name)
    private readonly collaborationRequestModel: Model<CollaborationRequest>,
    @InjectModel(Board.name) private readonly boardModel: Model<Board>,
    @InjectModel(Collaborator.name)
    private readonly collaboratorModel: Model<Collaborator>,
    @InjectModel(BoardMetadata.name)
    private readonly boardMetadataModel: Model<BoardMetadata>,
  ) {}

  async getCollaborationRequests(
    boardId: string,
  ): Promise<CollaborationRequest[]> {
    // Query request document from database
    const requests = await this.collaborationRequestModel.find({
      boardId: new Types.ObjectId(boardId),
      status: 'pending',
    });

    return requests; // return the results
  }

  async requestCollaboration(userId: string, boardId: string): Promise<any> {
    // Find the board from database
    const board = await this.boardModel.findOne({ _id: boardId });

    // Checking if the board exist or not
    if (!board) {
      throw new NotFoundException('board does not exist');
    }

    // Checking if the user already requested
    const alreadyRequested = await this.collaborationRequestModel.findOne({
      boardId: board._id,
      userId: new Types.ObjectId(userId),
    });

    // Checking if the user already requested for collaboration
    if (alreadyRequested) {
      throw new ConflictException('already requested');
    }
    // Creating a new request for collaboration
    const newRequest = await this.collaborationRequestModel.create({
      boardId: new Types.ObjectId(boardId),
      userId: new Types.ObjectId(userId),
    });
    await this.boardMetadataModel.findOneAndUpdate(
      {
        boardId: new Types.ObjectId(boardId),
      },
      {
        $push: {
          collaborators: userId,
        },
      },
    );

    return newRequest;
  }

  async acceptCollaborationRequest(
    boardId: string,
    requestedUserId: string,
  ): Promise<CollaborationRequest> {
    // Finding the request from database
    const request = await this.collaborationRequestModel.findOne({
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
      await this.collaborationRequestModel.findOneAndUpdate(
        {
          boardId: new Types.ObjectId(boardId),
          userId: new Types.ObjectId(requestedUserId),
        },
        {
          $set: { status: 'accepted' },
        },
      );

    // add the user to collaborator collection
    await this.collaboratorModel.create({
      boardId: new Types.ObjectId(boardId),
      userId: new Types.ObjectId(requestedUserId),
    });

    // update the user in board collection
    await this.boardModel.findOneAndUpdate(
      { _id: boardId },
      { $push: { collaborators: new Types.ObjectId(requestedUserId) } },
    );

    return acceptedRequest;
  }

  async rejectCollaborationRequest(
    boardId: string,
    requestedUserId: string,
  ): Promise<CollaborationRequest> {
    // Finding the request from database
    const request = await this.collaborationRequestModel.findOne({
      boardId: new Types.ObjectId(boardId),
      userId: new Types.ObjectId(requestedUserId),
    });

    // Checking if the board exist
    if (!request) {
      throw new NotFoundException('request does not exist');
    }

    // Updating the request status
    const acceptedRequest =
      await this.collaborationRequestModel.findOneAndUpdate(
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
}
