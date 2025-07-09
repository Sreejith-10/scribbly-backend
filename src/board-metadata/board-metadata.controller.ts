import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { BoardMetadataService } from './board-metadata.service';
import { JwtAuthGuard } from 'src/common/guards/auth';
import { CurrentUser } from 'src/common/decorators';
import { User } from 'src/user/schema';

@UseGuards(JwtAuthGuard)
@Controller('board-metadata')
export class BoardMetadataController {
  constructor(private readonly boardMetadataService: BoardMetadataService) {}

  @HttpCode(HttpStatus.OK)
  @Get('')
  async getBoardsMetadata(
    @CurrentUser() user: User,
    @Query('query') query: string,
  ) {
    const boardMetadatas = await this.boardMetadataService.getBoardsMetadata(
      user._id.toString(),
      query,
    );

    return { boardMetadatas };
  }

  @HttpCode(HttpStatus.OK)
  @Get('/:id')
  async getBoardMetadataBoardById(@Param('id') id: string) {
    const boardMetadata =
      await this.boardMetadataService.getBoardMetadataBoardById(id);
    return { boardMetadata };
  }
}
