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
import { Response } from 'express';
import { CreateBoardDto } from './dto';
import { User } from 'src/database/schema';

@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardController {
  constructor(private readonly boardService: BoardService) {}

  @HttpCode(HttpStatus.OK)
  @Get('/')
  async getBoards(
    @CurrentUser() user: Omit<User, 'password' | 'hashRt'>,
    @Res() res: Response,
  ) {
    const boards = await this.boardService.getBoards(user._id as string);
    return res.json({ boards });
  }

  @HttpCode(HttpStatus.OK)
  @Get('/metadata')
  async getBoardsMetadata(
    @CurrentUser() user: Omit<User, 'password' | 'hashRt'>,
    @Res() res: Response,
  ) {
    const boardMetadatas = await this.boardService.getBoardsMetadata(
      user._id as string,
    );

    return res.json({ boardMetadatas });
  }

  @HttpCode(HttpStatus.OK)
  @Get('/board/:id')
  async findBoard(@Param() { id }: { id: string }, @Res() res: Response) {
    const board = await this.boardService.findBoard(id);
    return res.json({ board });
  }

  @HttpCode(HttpStatus.CREATED)
  @Post('create')
  async createBoard(
    @CurrentUser() user: Omit<User, 'password' | 'hashRt'>,
    @Body() { title, description, accessMode }: CreateBoardDto,
    @Res() res: Response,
  ) {
    const board = await this.boardService.createBoard(user._id as string, {
      title,
      description,
      accessMode,
    });
    return res.json({ message: 'board created successfully', board });
  }
}
