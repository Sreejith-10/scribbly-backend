import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';
import { AuthModule } from './auth';
import { BoardModule } from './board';
import { CollaborationRequestModule } from './collaboration-request';
import { CollaboratorModule } from './collaborator';
import { UserModule } from './user';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    BoardModule,
    CollaborationRequestModule,
    CollaboratorModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
