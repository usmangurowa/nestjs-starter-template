import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegistrationDto, LoginDto } from './dto';
import * as argon from 'argon2';
import { Prisma, User } from '@prisma/client';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';
import { MailService } from 'src/mail/mail.service';

const config = {
  jwt_expires_in: '1d',
};

// regex to check if a string is a valid email

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private Jwt: JwtService,
    private mailService: MailService,
  ) {}
  async register(dto: RegistrationDto) {
    // generate the password hash
    const password = await argon.hash(dto.password);

    // delete the password from the dto
    delete dto.password;

    // create the user
    try {
      const user = await this.prisma.user.create({
        data: {
          ...dto,
          email: dto.email.toLowerCase(),
          password: password,
          social_media: dto.social_media as any,
        },
      });

      // delete the password from the user object
      delete user.password;

      // generate and return the jwt
      const token = await this.signToken(user);

      // return the user
      return { user, token, message: 'User created successfully' };
    } catch (error) {
      // check if the error is a duplicate email, phone or Username error and throw a custom error
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
          } else if (target[0].includes('phone_number')) {
            throw new ForbiddenException('Phone number already in use');
          } else {
            throw error;
          }
        }
      }
      throw error;
    }
  }
  async login(dto: LoginDto) {
    // find the user by email or username

    const user = await this.prisma.user.findUnique({
      where: {
        ...(dto.identifier.includes('@')
          ? {
              email: dto.identifier.toLocaleLowerCase().trim(),
            }
          : { username: dto.identifier.trim() }),
      },
    });

    // if user does not exist throw an error
    if (!user) {
      throw new ForbiddenException('Invalid credentials');
    }
    // compare the password
    const passwordValid = await argon.verify(user.password, dto.password);

    // if password is invalid throw an error

    if (!passwordValid) {
      throw new ForbiddenException('Invalid credentials');
    }

    // generate and return the jwt
    const token = await this.signToken(user);

    // return the user
    return { user, token, message: 'Login successful' };
  }

  async verifyEmail(token: string, user: User) {
    const tokenRecord = await this.prisma.token.findFirst({
      where: {
        user_id: user.id,
        token,
        createdAt: {
          lt: new Date(new Date().getTime() + 60 * 60 * 1000),
        },
      },
    });

    if (!tokenRecord) {
      throw new ForbiddenException('Invalid OTP or Expired OTP');
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        email_verified: true,
      },
    });

    await this.prisma.token.delete({
      where: {
        id: tokenRecord.id,
      },
    });

    return { message: 'Email verified successfully' };
  }

  // async sendEmailVerificationOtp(user: User) {
  //   const otp = await this.generateOTP(user.email);
  //   try {
  //     await this.mailService.sendEmail(
  //       [{ email: user.email, name: user.firstName + ' ' + user.lastName }],
  //       'Verify your email',
  //       `Your OTP is ${otp}`,
  //     );
  //     return { message: 'OTP sent' };
  //   } catch (error) {
  //     throw new Error(error);
  //   }
  // }

  // one time password (OTP)
  async generateToken(id: string) {
    // remove user tokens that have expire
    await this.prisma.token.deleteMany({
      where: {
        user_id: id,
        createdAt: {
          lte: new Date(new Date().getTime() - 60 * 60 * 1000), // filter tokens older than 1 hour
        },
      },
    });

    // generate a new token
    const token = Math.floor(100000 + Math.random() * 900000).toString();

    // save the token to the database
    await this.prisma.token.create({
      data: {
        token,
        user_id: id,
      },
    });

    return token;
  }

  // async verifyOTP(email: string, otp: string) {
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       email: email.toLocaleLowerCase(),
  //     },
  //   });
  //   if (!user) {
  //     throw new ForbiddenException('Invalid credentials');
  //   }
  //   const otpRecord = await this.prisma.otp.findFirst({
  //     where: {
  //       userId: user.id,
  //       type: 'email',
  //     },
  //   });
  //   if (!otpRecord) {
  //     throw new ForbiddenException('Invalid credentials');
  //   }
  //   const otpValid = await argon.verify(otpRecord.otp, otp);
  //   if (!otpValid) {
  //     throw new ForbiddenException('Invalid OTP');
  //   }
  //   await this.prisma.user.update({
  //     where: {
  //       id: user.id,
  //     },
  //     data: {
  //       emailVerified: true,
  //     },
  //   });

  //   await this.prisma.otp.delete({
  //     where: {
  //       id: otpRecord.id,
  //     },
  //   });

  //   return {
  //     message: 'OTP verified successfully',
  //   };
  // }

  // async sendPasswordReset(email: string) {
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       email: email.toLowerCase(),
  //     },
  //   });
  //   if (!user) {
  //     throw new ForbiddenException('Invalid credentials');
  //   }
  //   const otp = await this.generateOTP(email);
  //   this.mailService
  //     .sendEmail(
  //       [{ email: user.email, name: user.firstName + ' ' + user.lastName }],
  //       'Password reset',
  //       `Your OTP is ${otp}`,
  //     )
  //     .then(() => {
  //       return { message: 'OTP sent' };
  //     })
  //     .catch((error) => {
  //       throw error;
  //     });
  // }

  // async resetPassword(email: string, otp: string, password: string) {
  //   const user = await this.prisma.user.findUnique({
  //     where: {
  //       email: email.toLocaleLowerCase(),
  //     },
  //   });
  //   if (!user) {
  //     throw new ForbiddenException('Invalid credentials');
  //   }
  //   const otpRecord = await this.prisma.otp.findFirst({
  //     where: {
  //       userId: user.id,
  //       type: 'email',
  //     },
  //   });
  //   if (!otpRecord) {
  //     throw new ForbiddenException('Invalid credentials');
  //   }
  //   const otpValid = await argon.verify(otpRecord.otp, otp);
  //   if (!otpValid) {
  //     throw new ForbiddenException('Invalid OTP');
  //   }
  //   const passwordHash = await argon.hash(password);
  //   await this.prisma.user.update({
  //     where: {
  //       id: user.id,
  //     },
  //     data: {
  //       hash: passwordHash,
  //     },
  //   });

  //   await this.prisma.otp.delete({
  //     where: {
  //       id: otpRecord.id,
  //     },
  //   });

  //   return {
  //     message: 'Password reset successfully',
  //   };
  // }

  async signToken(
    user: Prisma.UserGetPayload<{
      select: { id: true; email: true; community_admin: true };
    }>,
  ): Promise<{ access_token: string; expiresIn: string }> {
    const payload = {
      sub: user.id,
      email: user.email,
      community_admin: user.community_admin,
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
