import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto, SignInDto } from './dto';
import { JwtGuard } from './guard';
import { User as GetUser } from './decorators';
import { User } from '@prisma/client';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: AuthDto) {
    return this.authService.signup(dto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('signin')
  signin(@Body() dto: SignInDto) {
    return this.authService.sigin(dto);
  }

  @UseGuards(JwtGuard)
  @Post('send-email-verification')
  sendVerification(@GetUser() user: User) {
    return this.authService.sendEmailVerificationOtp(user);
  }

  @UseGuards(JwtGuard)
  @Post('verify-email')
  verifyEmail(@Body() dto: { otp: string }, @GetUser() user: User) {
    return this.authService.verifyEmail(dto.otp, user);
  }

  // @UseGuards(JwtGuard)
  // @Post('resend-verification')
}
