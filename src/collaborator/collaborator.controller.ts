import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { CollaboratorService } from './collaborator.service';
import { Collaborator } from './schema';

@Controller('collaborators')
export class CollaboratorController {
  constructor(private readonly collaboratorService: CollaboratorService) {}

  @HttpCode(HttpStatus.OK)
  @Get(':boardId')
  async getCollaboratorsByBoardId(@Param('boardId') boardId: string) {
    const collaborators =
      await this.collaboratorService.getCollaboratorsByBoardId(boardId);

    return { collaborators };
  }

  @HttpCode(HttpStatus.OK)
  @Get(':boardId/:userId')
  async getCollaboratorByUserId(
    @Param('boardId') boardId: string,
    @Param('userId') userId: string,
  ) {
    const collaborators =
      await this.collaboratorService.getCollaboratorByUserId(boardId, userId);
    return { collaborators };
  }

  @HttpCode(HttpStatus.CREATED)
  @Post()
  async addCollaborator(@Body() dto: Omit<Collaborator, '_id'>) {
    const collaborator = await this.collaboratorService.addCollaborator(dto);
    return { collaborator, message: 'collaborator added' };
  }

  @HttpCode(HttpStatus.CREATED)
  @Patch(':boardId/:userId')
  async updateCollaborator(
    @Param('boardId') boardId: string,
    @Param('userId') userId: string,
    @Body() { role }: { role: 'edit' | 'view' },
  ) {
    const collaborator = await this.collaboratorService.updateCollaboratorRole(
      boardId,
      userId,
      role,
    );
    return { collaborator, message: 'collaborator role updated' };
  }
}
