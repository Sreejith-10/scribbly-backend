import { Injectable, Logger, UseInterceptors } from '@nestjs/common';
import { BoardService } from 'src/board';
import { Board } from 'src/board/schema';
import { CollaboratorService } from 'src/collaborator';
import { CatchErrorsInterceptor } from 'src/common/interceptor';
import { RedisService } from 'src/redis';
import { UserService } from 'src/user';

@UseInterceptors(CatchErrorsInterceptor)
@Injectable()
export class WebsocketService {
    private readonly logger = new Logger(WebsocketService.name);
    private readonly BOARD_PREFIX = 'board:';
    private readonly CLIENT_PREFIX = 'client:';
    private readonly SHAPE_PREFIX = 'shape:';

    constructor(
        private readonly redisService: RedisService,
        private readonly boardService: BoardService,
        private readonly collaboratorService: CollaboratorService,
        private readonly userService: UserService,
    ) {}

    async registerClient(clientId: string, userId: string): Promise<void> {
        const user = await this.userService.findUserById(userId);
        await this.redisService.set(
            `${this.CLIENT_PREFIX}${clientId}`,
            { userId, status: 'connected', username: user.username, clientId },
            43200, // 24h TTL
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
            this.redisService.set(
                `${this.CLIENT_PREFIX}${clientId}:board`,
                boardId,
            ),
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
            operation: 'create' | 'update' | 'delete';
            data?: any;
        },
    ): Promise<any> {
        const userId = await this.getClientUserId(clientId);
        if (!userId) {
            throw new Error('User not authenticated');
        }

        if (!delta || !delta.data) {
            throw new Error('Error fields not valid');
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
        const clientIds = await this.redisService.sMembers(
            `${this.BOARD_PREFIX}${boardId}:members`,
        );

        let members: Record<string, { clientId: string; username: string }> =
            {};

        for (const id of clientIds) {
            const clientData = await this.redisService.get<{
                userId: string;
                username: string;
            }>(`${this.CLIENT_PREFIX}${id}`);

            if (id !== clientId) {
                members = {
                    ...members,
                    [clientData.userId]: {
                        clientId: id,
                        username: clientData.username,
                    },
                };
            }
        }

        return members;
    }

    async verifyPermission(boardId: string, userId: string) {
        try {
            const board = await this.boardService.findBoard(boardId);
            if (board.ownerId.toString() === userId) {
                return true;
            }
            const user = await this.collaboratorService.getCollaboratorByUserId(
                boardId,
                userId,
            );

            return user.role === 'edit';
        } catch (error) {
            this.logger.error(error, 'Role error');
        }
    }

    async getUser(clientId: string): Promise<{
        userId: string;
        status: string;
        username: string;
        clientId: string;
    }> {
        return this.redisService.get(`${this.CLIENT_PREFIX}${clientId}`);
    }

    async lockShape(boardId: string, shapeId: string, userId: string) {
        if (!boardId || !shapeId || !userId) return false;
        const lockKey = `lock:${this.BOARD_PREFIX}${boardId}:${this.SHAPE_PREFIX}${shapeId}`;
        const lock = await this.redisService.get<string>(lockKey);

        // if the shape already locked
        if (lock) return false;

        // if not locked unlock the current locked shape of user
        const currentLockKey = await this.currentLockedShapeOfUser(
            boardId,
            userId,
        );

        // if the clicked shape and already locked shape are same return
        if (currentLockKey && currentLockKey.match(/shape:(.*)/)[1] === shapeId)
            return false;

        if (!currentLockKey) {
            await this.redisService.set(lockKey, userId, 120);
        } else {
            await this.redisService.del(currentLockKey);
            await this.redisService.set(lockKey, userId, 120);
        }

        return true;
    }

    async unlockShape(boardId: string, shapeId: string) {
        const lockKey = `lock:${this.BOARD_PREFIX}${boardId}:${this.SHAPE_PREFIX}${shapeId}`;
        return this.redisService.del(lockKey);
    }

    async isShapeLocked(boardId: string, shapeId: string) {
        const lockKey = `lock:${this.BOARD_PREFIX}${boardId}:${this.SHAPE_PREFIX}${shapeId}`;
        const lock = await this.redisService.get(lockKey);
        return lock;
    }

    async lockedShapes(boardId: string) {
        const lockedUserShapes = {};
        const lock = `lock:${this.BOARD_PREFIX}${boardId}:${this.SHAPE_PREFIX}*`;

        const keys = await this.redisService.keys(lock);

        if (keys.length < 0) {
            return lockedUserShapes;
        }

        for (const key of keys) {
            const uid = await this.redisService.get<string>(key);
            const dk = key.match(/shape:(.*)/)[1];
            const user = await this.userService.findUserById(uid);
            lockedUserShapes[dk] = { uid: user._id, username: user.username };
        }

        return lockedUserShapes;
    }

    async forcedShapeUnlock(boardId: string, userId: string) {
        const keys = await this.redisService.keys(
            `lock:${this.BOARD_PREFIX}${boardId}:*`,
        );
        for (const key of keys) {
            const u = await this.redisService.get(key);
            if (u === userId) {
                await this.redisService.del(key);
                break;
            }
        }
        return;
    }

    async currentLockedShapeOfUser(
        boardId: string,
        userId: string,
    ): Promise<string | null> {
        const lockKey = `lock:${this.BOARD_PREFIX}${boardId}:${this.SHAPE_PREFIX}*`;
        const keys = await this.redisService.keys(lockKey);

        if (keys.length < 0) return null;
        for (const key of keys) {
            const user = await this.redisService.get(key);
            if (user === userId) {
                return key;
            }
        }
    }

    async resetBoard(
        boardId: string,
        userId: string,
    ): Promise<{
        snapshot: Board['snapshot'];
        currentState: any;
        deltas: Board['deltas'];
        members: string[];
    }> {
        const owner = await this.boardService.isOwner(boardId, userId);

        if (!owner) {
            throw new Error('User cannot use this action');
        }

        const lock = `lock:${this.BOARD_PREFIX}${boardId}:${this.SHAPE_PREFIX}*`;
        const keys = await this.redisService.keys(lock);

        for (const key in keys) {
            await this.redisService.del(key);
        }

        await this.boardService.resetBoard(boardId);
        const boardState = await this.boardService.getBoardState(boardId);

        return {
            snapshot: boardState.snapshot,
            currentState: boardState.currentState,
            deltas: boardState.deltas,
            members: await this.redisService.sMembers(
                `${this.BOARD_PREFIX}${boardId}:members`,
            ),
        };
    }
}
