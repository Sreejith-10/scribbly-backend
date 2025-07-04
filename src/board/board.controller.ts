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
    const boards = await this.boardService.getBoards(user._id.toString());
    return { boards };
  }

  @HttpCode(HttpStatus.OK)
  @Get(':id')
  async findBoard(@Param('id') id: string) {
    const board = await this.boardService.findBoard(id);
    return { board };
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('')
  async createBoard(
    @CurrentUser() user: CurrentUserType,
    @Body() { title, description, accessMode }: CreateBoardDto,
  ) {
    const board = await this.boardService.createBoard(user._id.toString(), {
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
      user._id.toString(),
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
      user._id.toString(),
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
      user._id.toString(),
    );

    return { message: 'shape removed', delta };
  }

  // 3. Undo/Redo Endpoints
  @Patch(':id/undo')
  async undoLastAction(
    @Param('id') boardId: string,
    @CurrentUser() user: CurrentUserType,
  ) {
    const lastDelta = await this.boardService.getLastUserDelta(
      boardId,
      user._id.toString(),
    );
    if (!lastDelta) throw new NotFoundException('No actions to undo');

    const inverseDelta = this.createInverseDelta(lastDelta);
    return this.boardService.addDelta(
      boardId,
      inverseDelta,
      user._id.toString(),
    );
  }

  // 4. State Management
  @Get(':id/state')
  async getBoardState(@Param('id') boardId: string) {
    return this.boardService.getBoardState(boardId);
  }

  @Patch(':id/snapshot')
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
