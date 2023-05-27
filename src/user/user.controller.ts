import {
  Body,
  Controller,
  Delete,
  Get,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { User as GetUser } from '../auth/decorators/user.decorator';
import { JwtGuard } from '../auth/guard';
import { Settings, User } from 'prisma/prisma-client';
import { EditUserDto, EmploymentInfoDto, KycDto } from './dto';
import { UserService } from './user.service';

@UseGuards(JwtGuard)
@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}
  @Get('me')
  me(@GetUser() user: User) {
    return this.userService.getUser(user.id);
  }

  @Patch('me')
  editUser(@GetUser('id') id: string, @Body() data: EditUserDto) {
    return this.userService.editUser(id, data);
  }

  @Post('me/payment-pin')
  setPaymentPin(@GetUser('id') id: string, @Body() data: { pin: string }) {
    return this.userService.setPaymentPin(id, data.pin);
  }

  @Post('me/verify-payment-pin')
  verifyPaymentPin(@GetUser('id') id: string, @Body() data: { pin: string }) {
    // return this.userService.verifyPaymentPin(id, data.pin);
  }

  @Post('me/verify-authentication-pin')
  verifyAuthenticationPin(
    @GetUser('id') id: string,
    @Body() data: { pin: string },
  ) {
    return this.userService.verifyAuthenticationPin(id, data.pin);
  }

  @Post('me/push-token')
  setPushToken(@GetUser('id') id: string, @Body() data: { token: string }) {
    return this.userService.setPushToken(id, data.token);
  }

  @Delete('me/push-token')
  removePushToken(@GetUser('id') id: string, @Body() data: { token?: string }) {
    return this.userService.removePushToken(id, data?.token);
  }

  @Post('me/authentication-pin')
  setAuthenticationPin(
    @GetUser('id') id: string,
    @Body() data: { pin: string },
  ) {
    return this.userService.setAuthenticationPin(id, data.pin);
  }

  @Get('me/loan-eligibility')
  getLoanEligibility(@GetUser('id') id: string) {
    return this.userService.getLoanEligibility(id);
  }

  @Patch('me/settings')
  updateSettings(@GetUser('id') id: string, @Body() data: Settings | {}) {
    return this.userService.updateSettings(id, data);
  }

  @Post('me/employment-information')
  addEmploymentInformation(
    @GetUser('id') id: string,
    @Body() data: EmploymentInfoDto,
  ) {
    return this.userService.employmentInformation(id, data);
  }

  @Post('me/kyc')
  addKyc(@GetUser('id') id: string, @Body() data: KycDto) {
    return this.userService.kyc(id, data);
  }
}
