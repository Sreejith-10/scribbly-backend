import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators';
import { CollaborationRequestService } from './collaboration-request.service';
import { JwtAuthGuard } from 'src/common/guards/auth';
import { User } from 'src/user/schema';
import { CurrentUserType } from 'src/utils/types';

@UseGuards(JwtAuthGuard)
@Controller('collaboration-requests')
export class CollaborationRequestController {
  constructor(
    private readonly collaborationRequestService: CollaborationRequestService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Get(':boardId')
  async getCollaborationRequests(@Param('boardId') boardId: string) {
    const requests =
      await this.collaborationRequestService.getCollaborationRequestsByBoardId(
        boardId,
      );

    return { requests };
  }

  @HttpCode(HttpStatus.OK)
  @Get(':boardId/:userId/status')
  async getReqsetStatus(
    @Param('boardId') boardId: string,
    @Param('userId') userId: string,
  ) {
    const status = await this.collaborationRequestService.requestStatus(
      boardId,
      userId,
    );

    return { status };
  }

  @HttpCode(HttpStatus.OK)
  @Get(':userId/u')
  async getCurrentUsersRequests(@Param('userId') userId: string) {
    const requests =
      await this.collaborationRequestService.getCurrentUsersRequests(userId);

    return { requests };
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('')
  async requestCollaboration(
    @CurrentUser() user: CurrentUserType,
    @Body() { boardId }: { boardId: string },
  ) {
    const request = await this.collaborationRequestService.requestCollaboration(
      user._id.toString(),
      boardId,
    );

    return {
      message: 'collaboration request send',
      request,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/:boardId/:requestedUserId/accept')
  async accecptCollaborationRequest(
    @Param('boardId') boardId: string,
    @Param('requestedUserId') requestedUserId: string,
  ) {
    const request =
      await this.collaborationRequestService.acceptCollaborationRequest(
        boardId,
        requestedUserId,
      );

    return {
      message: 'collaboration request accepted',
      request,
    };
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':boardId/:requestedUserId/reject')
  async rejectCollaborationRequest(
    @Param('boardId') boardId: string,
    @Param('requestedUserId') requestedUserId: string,
  ) {
    const request =
      await this.collaborationRequestService.rejectCollaborationRequest(
        boardId,
        requestedUserId,
      );

    return {
      message: 'collaboration request rejected',
      request,
    };
  }
}
