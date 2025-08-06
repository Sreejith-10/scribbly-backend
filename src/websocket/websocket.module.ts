import { Module } from '@nestjs/common';
import { WebsocketService } from './websocket.service';
import { WebsocketGateway } from './websocket.gateway';
import { RedisModule } from 'src/redis';
import { BoardModule } from 'src/board';
import { WsAuthMiddleware } from 'src/common/middlewares';
import { JwtModule } from '@nestjs/jwt';
import { CollaboratorModule } from 'src/collaborator';

@Module({
  imports: [RedisModule, BoardModule, JwtModule, CollaboratorModule],
  providers: [WebsocketGateway, WebsocketService, WsAuthMiddleware],
})
export class WebsocketModule {}
