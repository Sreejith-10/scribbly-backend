import { Module } from '@nestjs/common';
import { WebsocketService } from './websocket.service';
import { WebsocketGateway } from './websocket.gateway';
import { RedisModule } from 'src/redis';
import { BoardModule } from 'src/board';
import { WsAuthMiddleware } from 'src/common/middlewares';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [RedisModule, BoardModule, JwtModule],
  providers: [WebsocketGateway, WebsocketService, WsAuthMiddleware],
})
export class WebsocketModule {}
