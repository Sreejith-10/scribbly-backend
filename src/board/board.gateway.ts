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
import { BoardService } from './board.service';

@WebSocketGateway(3333, { cors: { origin: '*' } })
export class BoardGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private readonly boardSerive: BoardService) {}

  handleConnection(client: Socket) {
    console.log(`${client.id} connected`);
  }

  handleDisconnect(client: Socket) {
    console.log(`${client.id} diconnected`);
  }

  @SubscribeMessage('join_collaboration')
  async joinCollaboration(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { id: string },
  ) {
    client.join(body.id);
  }

  @SubscribeMessage('onDraw')
  async onDraw(@MessageBody() body: { id: string; message: string }) {
    this.server.to(body.id).emit('chat', body.message);
  }

  async notifyJoinRequest(boardId: string, userId: string) {
    const board = await this.boardSerive.findBoard(boardId);

    this.server.to(board.ownerId.toString()).emit('join_request', {
      data: 'somebody is trying to join',
    });
  }

  @SubscribeMessage('join_request')
  async joinRequset(
    @MessageBody() body: any,
    @ConnectedSocket() client: Socket,
  ) {
    console.log(body);
    client.send(body);
  }
}
