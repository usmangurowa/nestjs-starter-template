import {
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class EditUserDto {
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  username?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  lastName?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  avatar?: string;

  @IsNotEmpty()
  @IsDateString()
  @IsOptional()
  dob?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  address?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  city?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  state?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  country?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  lga?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  maritalStatus?: 'single' | 'married' | 'divorced' | 'widowed';

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  gender?: 'male' | 'female';

  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  isEmploymentInformationComplete?: boolean;
}
