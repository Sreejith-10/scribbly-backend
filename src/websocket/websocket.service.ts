import { Injectable, Logger } from '@nestjs/common';
import { BoardService } from 'src/board';
import { Board } from 'src/board/schema';
import { CollaboratorService } from 'src/collaborator';
import { RedisService } from 'src/redis';

@Injectable()
export class WebsocketService {
  private readonly logger = new Logger(WebsocketService.name);
  private readonly BOARD_PREFIX = 'board:';
  private readonly CLIENT_PREFIX = 'client:';

  constructor(
    private readonly redisService: RedisService,
    private readonly boardService: BoardService,
    private readonly collaboratorService: CollaboratorService,
  ) {}

  async registerClient(clientId: string, userId: string): Promise<void> {
    await this.redisService.set(
      `${this.CLIENT_PREFIX}${clientId}`,
      { userId, status: 'connected' },
      86400, // 24h TTL
    );
  }

  async unregisterClient(clientId: string, userId: string): Promise<void> {
    const boardId = await this.getClientBoard(clientId);
    if (boardId) {
      await this.leaveBoard(clientId, userId);
    }
    await this.redisService.del(`${this.CLIENT_PREFIX}${clientId}`);
  }

  async joinBoard(
    clientId: string,
    boardId: string,
    userId: string,
  ): Promise<Board> {
    const currentBoard = await this.getClientBoard(clientId);
    if (currentBoard) {
      await this.leaveBoard(clientId, userId);
    }

    const board = await this.boardService.findBoard(boardId);
    if (!board) {
      this.logger.error('Board not found');
      throw new Error('Board not found');
    }

    this.logger.log(clientId, boardId);

    await Promise.all([
      this.redisService.set(`${this.CLIENT_PREFIX}${clientId}:board`, boardId),
      this.redisService.sAdd(
        `${this.BOARD_PREFIX}${boardId}:members`,
        clientId,
      ),
      this.collaboratorService.updateCollaboratorStatus(
        boardId,
        userId,
        'active',
      ),
    ]);

    return board;
  }

  async leaveBoard(clientId: string, userId: string): Promise<void> {
    const boardId = await this.getClientBoard(clientId);
    if (!boardId) return;

    await Promise.all([
      this.redisService.del(`${this.CLIENT_PREFIX}${clientId}:board`),
      this.redisService.sRem(
        `${this.BOARD_PREFIX}${boardId}:members`,
        clientId,
      ),
      this.collaboratorService.updateCollaboratorStatus(
        boardId,
        userId,
        'inactive',
      ),
    ]);
  }

  async getClientBoard(clientId: string): Promise<string | null> {
    return this.redisService.get(`${this.CLIENT_PREFIX}${clientId}:board`);
  }

  async getClientUserId(clientId: string): Promise<string | null> {
    const clientData = await this.redisService.get<{ userId: string }>(
      `${this.CLIENT_PREFIX}${clientId}`,
    );
    return clientData?.userId || null;
  }

  async processDelta(
    boardId: string,
    clientId: string,
    delta: {
      operation: 'create' | 'update' | 'delete' | 'move';
      data?: any;
    },
  ): Promise<any> {
    const userId = await this.getClientUserId(clientId);
    if (!userId) {
      this.logger.error('User not authenticated');
      throw new Error('User not authenticated');
    }

    const updatedBoard = await this.boardService.addDelta(
      boardId,
      {
        operation: delta.operation,
        shapeId: delta.data.id,
        ...delta,
      },
      userId,
    );

    if (!updatedBoard) {
      this.logger.error('Failed to proces delta');
      throw new Error('Failed to process delta');
    }

    const boardState = await this.boardService.getBoardState(boardId);

    return boardState;
  }

  async getBoardState(boardId: string): Promise<{
    snapshot: Board['snapshot'];
    currentState: any;
    deltas: Board['deltas'];
    members: string[];
  }> {
    const board = await this.boardService.getBoardState(boardId);
    if (!board) {
      this.logger.error('Board not found');
      throw new Error('Board not found');
    }

    return {
      snapshot: board.snapshot,
      currentState: board.currentState,
      deltas: board.deltas,
      members: await this.redisService.sMembers(
        `${this.BOARD_PREFIX}${boardId}:members`,
      ),
    };
  }

  async activeUsers(clientId: string) {
    const boardId = await this.getClientBoard(clientId);
    const members = await this.redisService.sMembers(
      `${this.BOARD_PREFIX}${boardId}:members`,
    );
    return members;
  }
}
