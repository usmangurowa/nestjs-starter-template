import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { NotificationService } from '../notification/notification.service';

@Module({
  controllers: [UserController],
  providers: [UserService, NotificationService],
})
export class UserModule {}
