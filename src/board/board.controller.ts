import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import { BoardService } from './board.service';
import { JwtAuthGuard } from 'src/common/guards/auth';
import { CurrentUser } from 'src/common/decorators';
import { User } from 'src/database/user';
import { Response } from 'express';
import { CreateBoardDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('board')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @Get(':id')
  async findBoard(@Param() { id }: { id: string }, @Res() res: Response) {
    const board = await this.boardService.findBoard(id);
    return res.json({ data: { board } });
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('create')
  async createBoard(
    @CurrentUser() user: Omit<User, 'password' | 'hashRt'>,
    @Body() { title }: CreateBoardDto,
    @Res() res: Response,
  ) {
    const board = await this.boardService.createBoard(user._id, title);
    return res.json({ message: 'board created successfully', data: { board } });
  }
}
