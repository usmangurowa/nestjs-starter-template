import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EditUserDto, EmploymentInfoDto, KycDto } from './dto';
import * as argon from 'argon2';
import { Settings } from '@prisma/client';
import * as _ from 'lodash';
import { NotificationService } from '../notification/notification.service';

const basic_profile = [
  'username',
  'firstName',
  'lastName',
  'email',
  'phone',
  'gender',
  'dob',
  'state',
  'lga',
];

const checkIfEmploymentInfoComplete = (data: EmploymentInfoDto) => {
  switch (data.occupation) {
    case 'employed':
      return (
        data.startDate &&
        data.name &&
        data.address &&
        data.monthlyIncome &&
        data.startDate &&
        data.sector &&
        data.role
      );

    case 'self-employed':
      return (
        data.startDate &&
        data.name &&
        data.address &&
        data.monthlyIncome &&
        data.sector &&
        data.role
      );
    case 'student':
      return data.name && data.address && data.startDate && data.role;
    case 'unemployed':
      return (
        data.name &&
        data.address &&
        data.startDate &&
        data.role &&
        data.sector &&
        data.endDate
      );
  }
};

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        KYC: true,
        settings: true,
        employmentInformation: true,
      },
    });

    delete user.hash;
    delete user.paymentPin;
    delete user.authenticationPin;
    return user;
  }

  async updateSettings(id: string, data: Settings | {}) {
    const settings = await this.prisma.settings.upsert({
      where: { userId: id },
      update: data,
      create: {
        userId: id,
        ...data,
      },
    });
    return settings;
  }

  async getLoanEligibility(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    const checkIfHasActiveLoan = await this.prisma.loan.findFirst({
      where: {
        userId: id,
        OR: [
          {
            status: 'pending',
          },
          {
            status: 'approved',
          },
          {
            status: 'disbursed',
          },
        ],
      },
    });

    if (checkIfHasActiveLoan) {
      this.notificationService.sendPushNotification({
        title: 'Loan Application',
        body: 'You have an active loan. Please pay up before applying for another loan',
        to: user.pushTokens,
        sound: 'default',
        priority: 'high',
        data: {
          type: 'loan',
        },
      });
      return {
        isEligible: false,
        message:
          'You have an active loan. Please pay up before applying for another loan',
      };
    }

    const isEligible =
      user?.isProfileComplete &&
      user.isEmploymentInformationComplete &&
      user.isKYC;

    this.notificationService.sendPushNotification({
      title: 'Loan Application',
      body: isEligible
        ? 'You are eligible for a loan'
        : 'You are not eligible for a loan',
      to: user.pushTokens,
      sound: 'default',
      priority: 'high',
    });

    return {
      isEligible,
      message: isEligible
        ? 'You are eligible for a loan'
        : 'You are not eligible for a loan',
    };
  }

  async editUser(id: string, data: EditUserDto) {
    const isProfileComplete = _.keysIn(
      _.pickBy(
        _.pick(data, basic_profile),
        (value) => _.isUndefined(value) || _.isNull(value),
      ),
    ).length;

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        ...data,
        isProfileComplete: !isProfileComplete,
        profileCompletePercentage: Math.round(
          ((basic_profile.length - isProfileComplete) / basic_profile.length) *
            100,
        ),
      },
    });
    delete user.hash;
    return { user, message: 'Profile updated successfully' };
  }

  async verifyAuthenticationPin(id: string, pin: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        authenticationPin: true,
      },
    });
    const isVerified = await argon.verify(user.authenticationPin, pin);
    if (!isVerified) throw new ForbiddenException('Invalid pin');
    return { message: 'Pin verified successfully', isVerified };
  }

  async setPaymentPin(id: string, pin: string) {
    if (pin.length !== 4) throw new ForbiddenException('Pin must be 4 digits');
    const paymentPin = await argon.hash(pin);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        paymentPin,
        settings: {
          update: {
            hasPaymentPin: true,
          },
        },
      },
    });

    delete user.hash;
    delete user?.paymentPin;
    delete user?.authenticationPin;
    return { user, message: 'Payment pin set successfully' };
  }

  async setPushToken(id: string, token: string) {
    const tokens = await this.prisma.user.findUnique({
      where: { id },
      select: {
        pushTokens: true,
      },
    });

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        pushTokens: [...tokens.pushTokens, token],
      },
    });

    return { user, message: 'Push token set successfully' };
  }

  async removePushToken(id: string, token?: string) {
    const tokens = await this.prisma.user.findUnique({
      where: { id },
      select: {
        pushTokens: true,
      },
    });

    const pushTokens = token
      ? tokens.pushTokens.filter((t) => t !== token)
      : [];

    const user = await this.prisma.user.update({
      where: { id },
      data: {
        pushTokens,
      },
    });

    return { user, message: 'Push token removed successfully' };
  }

  async setAuthenticationPin(id: string, pin: string) {
    if (pin.length !== 6) throw new ForbiddenException('Pin must be 4 digits');
    const authenticationPin = await argon.hash(pin);
    const user = await this.prisma.user.update({
      where: { id },
      data: {
        authenticationPin,
        settings: {
          update: {
            hasAuthenticationPin: true,
          },
        },
      },
    });
    delete user.hash;
    delete user?.paymentPin;
    delete user?.authenticationPin;
    return { user, message: 'Authentication pin set successfully' };
  }

  async employmentInformation(id: string, data: EmploymentInfoDto) {
    const employmentInfo = await this.prisma.employmentInformation.upsert({
      where: { userId: id },
      update: {
        ...data,
        monthlyIncome: Number(data.monthlyIncome) || 0,
        endDate: data.endDate || null,
        salaryDate: data.salaryDate || null,
        startDate: data.startDate || null,
      },
      create: {
        userId: id,
        ...data,
        monthlyIncome: Number(data.monthlyIncome) || 0,
        endDate: data.endDate || null,
        salaryDate: data.salaryDate || null,
        startDate: data.startDate || null,
      },
    });
    await this.editUser(id, {
      isEmploymentInformationComplete: !!checkIfEmploymentInfoComplete(data),
    });
    return { employmentInfo, message: 'Employment information added' };
  }

  async kyc(id: string, data: KycDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        KYC: true,
      },
    });

    if (
      user.firstName.toLowerCase() !== data.firstName.toLowerCase() &&
      user.lastName.toLowerCase() !== data.lastName.toLowerCase()
    ) {
      throw new ForbiddenException(
        'First name and last name must match the name on your ID',
      );
    }

    if (user.KYC) {
      await this.prisma.user.update({
        where: { id },
        data: {
          isKYC: true,
          KYC: {
            update: {
              bvn: data.bvn,
            },
          },
        },
      });
    } else {
      await this.prisma.user.update({
        where: { id },
        data: {
          isKYC: true,
          KYC: {
            create: {
              bvn: data.bvn,
            },
          },
        },
      });
    }

    delete user.hash;
    delete user?.paymentPin;
    delete user?.authenticationPin;

    return {
      message: 'KYC created successfully',
      user,
    };
  }
}
