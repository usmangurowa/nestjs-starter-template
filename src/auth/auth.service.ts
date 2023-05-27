import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthDto, SignInDto } from './dto';
import * as argon from 'argon2';
import { Prisma, User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { MailService } from 'src/mail/mail.service';

const config = {
  jwt_expires_in: '1d',
};

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private Jwt: JwtService,
    private mailService: MailService,
  ) {}
  async signup(dto: AuthDto) {
    // generate the password hash
    const password = await argon.hash(dto.password);
    // create the user
    delete dto.password;
    try {
      const user = await this.prisma.user.create({
        data: {
          ...dto,
          email: dto.email.toLowerCase(),
          hash: password,
        },
        select: {
          hash: false,
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          isAdmin: true,
          username: true,
        },
      });

      const token = await this.signToken(user);

      return { user, token, message: 'User created successfully' };
    } catch (error) {
      console.log(error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          console.log(error.meta.target);
          const target = Array.isArray(error.meta.target)
            ? error.meta.target
            : [error.meta.target];
          if (target[0].includes('email')) {
            throw new ForbiddenException('Email already in use');
          } else if (target[0].includes('phone')) {
            throw new ForbiddenException('Phone number already in use');
          } else if (target[0].includes('username')) {
            throw new ForbiddenException('Username already in use');
          }
        }
      }
      throw error;
    }
  }
  async sigin(dto: SignInDto) {
    // find the user by email
    const user = await this.prisma.user.findUnique({
      where: {
        email: dto.email.toLocaleLowerCase(),
      },
      include: {
        settings: true,
        KYC: true,
      },
    });
    // if user does not exist throw an error
    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }
    // compare the password
    const passwordValid = await argon.verify(user.hash, dto.password);

    if (!passwordValid) {
      throw new ForbiddenException('Invalid credentials');
    }

    delete user.hash;
    delete user.paymentPin;
    delete user.authenticationPin;

    // generate the jwt
    // return the jwt

    const token = await this.signToken(user);

    return { user, token, message: 'Login successful' };
  }

  async verifyEmail(otp: string, user: User) {
    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
      },
    });
    if (!otpRecord) {
      throw new ForbiddenException('Invalid OTP');
    }

    const otpValid = await argon.verify(otpRecord.otp, otp);

    if (!otpValid) {
      throw new ForbiddenException('Invalid OTP');
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
      },
    });

    await this.prisma.otp.deleteMany({
      where: {
        userId: user.id,
      },
    });

    return { message: 'Email verified successfully' };
  }

  async sendEmailVerificationOtp(user: User) {
    const otp = await this.generateOTP(user.email);
    try {
      await this.mailService.sendEmail(
        [{ email: user.email, name: user.firstName + ' ' + user.lastName }],
        'Verify your email',
        `Your OTP is ${otp}`,
      );
      return { message: 'OTP sent' };
    } catch (error) {
      throw new Error(error);
    }
  }

  async generateOTP(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });
    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }

    await this.prisma.otp.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const otp = Math.floor(100000 + Math.random() * 900000);
    const otpHash = await argon.hash(otp.toString());
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.prisma.otp.create({
      data: {
        otp: otpHash,
        expiresAt,
        type: 'email',
        userId: user.id,
      },
    });

    return otp;
  }

  async verifyOTP(email: string, otp: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email.toLocaleLowerCase(),
      },
    });
    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }
    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        type: 'email',
      },
    });
    if (!otpRecord) {
      throw new ForbiddenException('Invalid credentials');
    }
    const otpValid = await argon.verify(otpRecord.otp, otp);
    if (!otpValid) {
      throw new ForbiddenException('Invalid OTP');
    }
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        emailVerified: true,
      },
    });

    await this.prisma.otp.delete({
      where: {
        id: otpRecord.id,
      },
    });

    return {
      message: 'OTP verified successfully',
    };
  }

  async sendPasswordReset(email: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });
    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }
    const otp = await this.generateOTP(email);
    this.mailService
      .sendEmail(
        [{ email: user.email, name: user.firstName + ' ' + user.lastName }],
        'Password reset',
        `Your OTP is ${otp}`,
      )
      .then(() => {
        return { message: 'OTP sent' };
      })
      .catch((error) => {
        throw error;
      });
  }

  async resetPassword(email: string, otp: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: {
        email: email.toLocaleLowerCase(),
      },
    });
    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }
    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        type: 'email',
      },
    });
    if (!otpRecord) {
      throw new ForbiddenException('Invalid credentials');
    }
    const otpValid = await argon.verify(otpRecord.otp, otp);
    if (!otpValid) {
      throw new ForbiddenException('Invalid OTP');
    }
    const passwordHash = await argon.hash(password);
    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        hash: passwordHash,
      },
    });

    await this.prisma.otp.delete({
      where: {
        id: otpRecord.id,
      },
    });

    return {
      message: 'Password reset successfully',
    };
  }

  async signToken(
    user: Prisma.UserGetPayload<{
      select: { id: true; email: true; isAdmin: true };
    }>,
  ): Promise<{ access_token: string; expiresIn: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };
    const token = await this.Jwt.signAsync(payload, {
      expiresIn: config.jwt_expires_in,
      secret: process.env.JWT_SECRET,
    });
    return {
      access_token: token,
      expiresIn: config.jwt_expires_in,
    };
  }
}
