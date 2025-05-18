import { Types } from 'mongoose';
import { Board } from 'src/database/board';
import { BoardRepository } from './../database/board';
import { Injectable, NotFoundException } from '@nestjs/common';

@Injectable()
export class BoardService {
  constructor(private readonly boardRepository: BoardRepository) {}

  async findBoard(id: string): Promise<Board> {
    // Querying board from database with id
    const board = await this.boardRepository.findOne({
      _id: id,
    });

    // Checking if the board exist or not
    if (!board) {
      throw new NotFoundException('board does not exist');
    }

    return board; // return the board
  }

  async createBoard(uId: Types.ObjectId, title: string): Promise<Board> {
    // create a new board
    return await this.boardRepository.create({
      ownerId: uId,
      title,
      shapes: [],
      accessMode: 'private',
    });
  }
}
