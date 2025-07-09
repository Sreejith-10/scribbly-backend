import {
  Body,
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
import { User } from 'src/user/schema';

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
      await this.collaborationRequestService.getCollaborationRequestsByBoardId(
        boardId,
      );

    return res.json({ requests });
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('')
  async requestCollaboration(
    @CurrentUser() user: Omit<User, 'password' | 'hashRt'>,
    @Body() { link }: { link: string },
    @Res() res: Response,
  ) {
    const request = await this.collaborationRequestService.requestCollaboration(
      user._id.toString(),
      link,
    );

    return res.json({
      message: 'collaboration request send',
      request,
    });
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/:boardId/:requestedUserId/accept')
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
      request,
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
      request,
    });
  }
}
