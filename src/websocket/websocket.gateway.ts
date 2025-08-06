import { Server, Socket } from 'socket.io';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { WebsocketService } from './websocket.service';
import { Logger, OnModuleInit } from '@nestjs/common';
import { WsAuthMiddleware } from 'src/common/middlewares';

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
    this.logger.log(`Client connected: ${client.id}`);
    await this.websocketService.registerClient(client.id, client.user?.uid);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    const boardId = await this.websocketService.getClientBoard(client.id);
    if (boardId) {
      await this.websocketService.leaveBoard(client.id, client.user.uid);
      client.leave(boardId);
      client.to(boardId).emit('userLeft', { userId: client.id });
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

      client.to(paylod.boardId).emit('userJoined', {
        userId: client.id,
        timestamp: Date.now(),
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
      client.leave(boardId);
      client.to(boardId).emit('userLeft', { userId: client.id });
    }
  }

  @SubscribeMessage('boardUpdate')
  async handleBoardUpdate(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      operation: 'create' | 'update' | 'delete' | 'move';
      shapeId: string;
      data?: any;
    },
  ) {
    try {
      const boardId = await this.websocketService.getClientBoard(client.id);
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
    const members = await this.websocketService.activeUsers(client.id);
    client.emit('activeUsers', members);
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
      .emit('mouseMove', { x: paylod.x, y: paylod.y, userId: client.id });
  }
}
