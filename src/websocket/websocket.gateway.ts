import { Logger, OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { WsAuthMiddleware } from 'src/common/middlewares';
import { WebsocketService } from './websocket.service';

@WebSocketGateway({
  cookie: true,
  cors: {
    credentials: true,
    origin: '*',
    // origin: process.env.CLIENT,
  },
  pingInterval: 30000,
  pingTimeout: 10000,
  transports: ['websocket'],
  perMessageDeflate: false,
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer() server: Server;
  protected readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private readonly websocketService: WebsocketService,
    private readonly wsAuthMiddleware: WsAuthMiddleware,
  ) {}

  async handleConnection(client: Socket) {
    this.logger.log('Socket connection');
    this.logger.log(`Client connected: ${client.id}`);
    await this.websocketService.registerClient(client.id, client.user?.uid);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const boardId = await this.websocketService.getClientBoard(client.id);
    if (boardId) {
      await this.websocketService.leaveBoard(client.id, client.user.uid);
      await this.websocketService.forcedShapeUnlock(boardId, client.user.uid);
      client.leave(boardId);
      client
        .to(boardId)
        .emit('userLeft', {
          clientId: client.id,
          userId: client.user.uid,
          username: client.user.name,
        });
    }
    await this.websocketService.unregisterClient(client.id, client.user.uid);
  }

  onModuleInit() {
    this.server.use(this.wsAuthMiddleware.use.bind(this.wsAuthMiddleware));
  }

  @SubscribeMessage('joinBoard')
  async handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() paylod: { boardId: string },
  ) {
    try {
      await this.websocketService.leaveBoard(client.id, client.user.uid);

      await this.websocketService.joinBoard(
        client.id,
        paylod.boardId,
        client.user.uid,
      );
      client.join(paylod.boardId);

      const boardState = await this.websocketService.getBoardState(
        paylod.boardId,
      );
      client.emit('boardState', boardState);

      const lockedShapes = await this.websocketService.lockedShapes(
        paylod.boardId,
      );
      client.emit('currentlyLockedShapes', lockedShapes);

      const user = await this.websocketService.getUser(client.id);

      client.to(paylod.boardId).emit('userJoined', {
        userId: client.id,
        timestamp: Date.now(),
        username: user.username,
      });

      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Join error: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }

  @SubscribeMessage('leaveBoard')
  async handleLeaveBoard(client: Socket) {
    const boardId = await this.websocketService.getClientBoard(client.id);
    if (boardId) {
      await this.websocketService.leaveBoard(client.id, client.user.uid);
      client
        .to(boardId)
        .emit('userLeft', { clientId: client.id, userId: client.user.uid });
      client.leave(boardId);
    }
  }

  @SubscribeMessage('boardUpdate')
  async handleBoardUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      operation: 'create' | 'update' | 'delete';
      shapeId: string;
      data?: any;
    },
  ) {
    try {
      const boardId = await this.websocketService.getClientBoard(client.id);
      const permission = await this.websocketService.verifyPermission(
        boardId,
        client.user.uid,
      );
      if (!permission) throw new Error('You dont have permission to edit');
      if (!boardId) throw new Error('Not in any board');

      const processedDelta = await this.websocketService.processDelta(
        boardId,
        client.id,
        payload,
      );

      client.to(boardId).emit('boardUpdate', processedDelta);
      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Update error: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }

  @SubscribeMessage('activeUsers')
  async activeUsers(@ConnectedSocket() client: Socket) {
    const board = await this.websocketService.getClientBoard(client.id);
    const members = await this.websocketService.activeUsers(client.id);
    this.server.to(board).emit('activeUsers', members);
  }

  @SubscribeMessage('boardChange')
  async boardChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: any,
  ) {
    const board = await this.websocketService.getClientBoard(client.id);
    client.to(board).emit('updatedBoard', payload);
  }

  @SubscribeMessage('mouseMove')
  async mouseMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() paylod: { x: number; y: number },
  ) {
    const board = await this.websocketService.getClientBoard(client.id);

    client
      .to(board)
      .emit('mouseMove', {
        x: paylod.x,
        y: paylod.y,
        clientId: client.id,
        userId: client.user.uid,
      });
  }

  @SubscribeMessage('selectShape')
  async selectShape(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { shapeId: string },
  ) {
    const board = await this.websocketService.getClientBoard(client.id);
    const lock = await this.websocketService.isShapeLocked(
      board,
      payload.shapeId,
    );

    if (lock) {
      if (client.user.uid === lock) {
        await this.websocketService.unlockShape(board, payload.shapeId);
        await this.websocketService.lockShape(
          board,
          payload.shapeId,
          client.user.uid,
        );
      }
    } else {
      await this.websocketService.lockShape(
        board,
        payload.shapeId,
        client.user.uid,
      );
    }

    client
      .to(board)
      .emit('lockedNewShape', {
        shapeId: payload.shapeId,
        lockUser: { uid: client.user.uid, username: client.user.name },
      });
  }

  @SubscribeMessage('lockShape')
  async lockShape(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { shapeId: string },
  ) {
    const board = await this.websocketService.getClientBoard(client.id);
    const lock = await this.websocketService.lockShape(
      board,
      payload.shapeId,
      client.user.uid,
    );
    if (!lock) {
      await this.websocketService.unlockShape(board, payload.shapeId);
    }

    return { message: 'shape locked' };
  }

  @SubscribeMessage('unlockShape')
  async unlockShape(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { shapeId: string },
  ) {
    const board = await this.websocketService.getClientBoard(client.id);
    await this.websocketService.unlockShape(board, payload.shapeId);
    client.to(board).emit('unlockShape', { shapeId: payload.shapeId });
  }
}
