import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateSettingsDto {
  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  hasPaymentPin?: boolean;

  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  hasAuthenticationPin?: boolean;

  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  enabledBiometrics?: boolean;

  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  enabledEmail?: boolean;

  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  enabledNotifications?: string;
}
