import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from 'src/common/decorators';
import { CollaborationRequestService } from './collaboration-request.service';
import { Response } from 'express';
import { JwtAuthGuard } from 'src/common/guards/auth';
import { User } from 'src/database/schema';

@UseGuards(JwtAuthGuard)
@Controller('collaboration-requests')
export class CollaborationRequestController {
  constructor(
    private readonly collaborationRequestService: CollaborationRequestService,
  ) {}

  @HttpCode(HttpStatus.OK)
  @Get(':boardId')
  async getCollaborationRequests(
    @Param() { boardId }: { boardId: string },
    @Res() res: Response,
  ) {
    const requests =
      await this.collaborationRequestService.getCollaborationRequests(boardId);

    return res.json({ data: { requests } });
  }

  @HttpCode(HttpStatus.CREATED)
  @Post(':boardId/request')
  async requestCollaboration(
    @CurrentUser() user: Omit<User, 'password' | 'hashRt'>,
    @Param() { boardId }: { boardId: string },
    @Res() res: Response,
  ) {
    const request = await this.collaborationRequestService.requestCollaboration(
      user._id as string,
      boardId,
    );

    return res.json({
      message: 'collaboration request send',
      data: { request },
    });
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':boardId/:requestedUserId/accept')
  async accecptCollaborationRequest(
    @Param()
    { boardId, requestedUserId }: { boardId: string; requestedUserId: string },
    @Res() res: Response,
  ) {
    const request =
      await this.collaborationRequestService.acceptCollaborationRequest(
        boardId,
        requestedUserId,
      );

    return res.json({
      message: 'collaboration request accepted',
      data: { request },
    });
  }

  @HttpCode(HttpStatus.OK)
  @Patch(':boardId/:requestedUserId/reject')
  async rejectCollaborationRequest(
    @Param()
    { boardId, requestedUserId }: { boardId: string; requestedUserId: string },
    @Res() res: Response,
  ) {
    const request =
      await this.collaborationRequestService.rejectCollaborationRequest(
        boardId,
        requestedUserId,
      );

    return res.json({
      message: 'collaboration request rejected',
      data: { request },
    });
  }
}
