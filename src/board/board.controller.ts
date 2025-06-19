import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { JwtAuthGuard } from 'src/common/guards/auth';
import { CurrentUser } from 'src/common/decorators';
import { CreateBoardDto } from './dto';
import { CurrentUserType } from 'src/utils/types';

@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/')
  async getBoards(@CurrentUser() user: CurrentUserType) {
    const boards = await this.boardService.getBoards(user._id as string);
    return { boards };
  }

  @HttpCode(HttpStatus.OK)
  @Get('/metadata')
  async getBoardsMetadata(@CurrentUser() user: CurrentUserType) {
    const boardMetadatas = await this.boardService.getBoardsMetadata(
      user._id as string,
    );

    return { boardMetadatas };
  }

  @HttpCode(HttpStatus.OK)
  @Get('/board/:id')
  async findBoard(@Param('id') id: string) {
    const board = await this.boardService.findBoard(id);
    return { board };
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('create')
  async createBoard(
    @CurrentUser() user: CurrentUserType,
    @Body() { title, description, accessMode }: CreateBoardDto,
  ) {
    const board = await this.boardService.createBoard(user._id as string, {
      title,
      description,
      accessMode,
    });
    return { message: 'board created successfully', board };
  }

  // Shape operations
  @Post(':id/shapes')
  async addShape(
    @Param('id') id: string,
    @Body() { shapeId, data }: { shapeId: string; data: any },
    @CurrentUser() user: CurrentUserType,
  ) {
    const delta = await this.boardService.addDelta(
      id,
      {
        operation: 'create',
        shapeId,
        data,
      },
      user._id as string,
    );

    return {
      message: 'shape added',
      delta,
    };
  }

  @Patch(':id/shapes/:shapeId')
  async updateShape(
    @Param('id') boardId: string,
    @Param('shapeId') shapeId: string,
    @Body() { data }: { data: any },
    @CurrentUser() user: CurrentUserType,
  ) {
    const delta = this.boardService.addDelta(
      boardId,
      {
        operation: 'update',
        shapeId,
        data,
      },
      user._id as string,
    );

    return { message: 'shape updated', delta };
  }

  @Delete(':id/shapes/:shapeId')
  async deleteShape(
    @Param('id') boardId: string,
    @Param('shapeId') shapeId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    const delta = this.boardService.addDelta(
      boardId,
      {
        operation: 'delete',
        shapeId,
      },
      user._id as string,
    );

    return { message: 'shape removed', delta };
  }

  // 3. Undo/Redo Endpoints
  @Post(':id/undo')
  async undoLastAction(
    @Param('id') boardId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    const lastDelta = await this.boardService.getLastUserDelta(
      boardId,
      user.id as string,
    );
    if (!lastDelta) throw new NotFoundException('No actions to undo');

    const inverseDelta = this.createInverseDelta(lastDelta);
    return this.boardService.addDelta(boardId, inverseDelta, user.id as string);
  }

  // 4. State Management
  @Get(':id/state')
  async getBoardState(@Param('id') boardId: string) {
    return this.boardService.getBoardState(boardId);
  }

  @Post(':id/snapshot')
  async createSnapshot(@Param('id') boardId: string) {
    return this.boardService.createSnapshot(boardId);
  }

  private createInverseDelta(delta: any) {
    switch (delta.operation) {
      case 'create':
        return { ...delta, operation: 'delete' };
      case 'delete':
        return { ...delta, operation: 'create', data: delta.data };
      case 'update':
        return { ...delta, data: delta.previousData };
    }
  }
}
