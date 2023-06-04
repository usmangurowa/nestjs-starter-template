import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegistrationDto, LoginDto } from './dto';
import { JwtGuard } from './guard';
import { User as GetUser } from './decorators';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegistrationDto) {
    return this.authService.register(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  // @UseGuards(JwtGuard)
  // @Post('send-email-verification')
  // sendVerification(@GetUser() user: User) {
  //   return this.authService.sendEmailVerificationOtp(user);
  // }

  @UseGuards(JwtGuard)
  @Post('verify-email')
  verifyEmail(@Body() { token }: { token: string }, @GetUser() user: User) {
    return this.authService.verifyEmail(token, user);
  }

  // @UseGuards(JwtGuard)
  // @Post('resend-verification')
}
