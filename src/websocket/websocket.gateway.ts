import { Server, Socket } from 'socket.io';
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  OnGatewayInit,
} from '@nestjs/websockets';
import { WebsocketService } from './websocket.service';
import { UseGuards } from '@nestjs/common';
import { WebsocketAuthGuard } from 'src/common/guards/auth';

@UseGuards(WebsocketAuthGuard)
@WebSocketGateway({
  cookie: true,
  cors: {
    credentials: true,
    origin: process.env.CLIENT,
  },
})
export class WebsocketGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly websocketService: WebsocketService) {}

  handleConnection(client: Socket): void {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  joinRoom(@MessageBody() payload: { boardId: string }) {
    console.log({ payload });
  }
}
