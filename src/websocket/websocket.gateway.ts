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
    origin: process.env.CLIENT,
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
    await this.websocketService.unregisterClient(client.id);
  }

  onModuleInit() {
    this.server.use(this.wsAuthMiddleware.use.bind(this.wsAuthMiddleware));
  }

  @SubscribeMessage('join-board')
  async handleJoinBoard(
    @ConnectedSocket() client: Socket,
    @MessageBody() paylod: { boardId: string },
  ) {
    try {
      await this.websocketService.joinBoard(client.id, paylod.boardId);
      client.join(paylod.boardId);

      const boardState = await this.websocketService.getBoardState(
        paylod.boardId,
      );
      client.emit('board-state', boardState);

      this.server.to(paylod.boardId).emit('userJoined', {
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
      await this.websocketService.leaveBoard(client.id);
      client.leave(boardId);
      this.server.to(boardId).emit('userLeft', { userId: client.id });
    }
  }

  @SubscribeMessage('boardUpdate')
  async handleBoardUpdate(
    @ConnectedSocket() client: Socket,
    payload: { delta: any },
  ) {
    try {
      const boardId = await this.websocketService.getClientBoard(client.id);
      if (!boardId) throw new Error('Not in any board');

      const processedDelta = await this.websocketService.processDelta(
        boardId,
        client.id,
        payload.delta,
      );

      this.server.to(boardId).emit('boardUpdate', processedDelta);
      return { status: 'success' };
    } catch (error) {
      this.logger.error(`Update error: ${error.message}`);
      return { status: 'error', message: error.message };
    }
  }
}
