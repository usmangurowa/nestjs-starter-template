import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

class Socials {
  @IsString()
  @IsUrl()
  @IsOptional()
  facebook?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  twitter?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  instagram?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  youtube?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  linkedin?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  github?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  behance?: string;

  @IsString()
  @IsUrl()
  @IsOptional()
  dribbble?: string;
}

type SocialsType = {
  facebook?: string;
  twitter?: string;
  instagram?: string;
  youtube?: string;
  linkedin?: string;
  github?: string;
  behance?: string;
  dribbble?: string;
};

export class RegistrationDto {
  @IsString()
  @IsNotEmpty()
  first_name: string;

  @IsString()
  @IsNotEmpty()
  last_name: string;

  @IsString()
  @IsOptional()
  gender?: string;

  @IsString()
  @IsNotEmpty()
  username: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsOptional()
  date_of_birth?: string | null;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsOptional()
  social_media?: SocialsType;

  @IsString()
  @IsOptional()
  referral_method?: string;

  @IsArray()
  @IsOptional()
  interests?: string[];

  // @IsBoolean()
  // @IsOptional()
  // is_public?: boolean;

  // @IsBoolean()
  // @IsOptional()
  // email_verified?: boolean;

  // @IsBoolean()
  // @IsOptional()
  // account_disabled?: boolean;

  // @IsBoolean()
  // @IsOptional()
  // community_admin?: boolean;

  // @IsString()
  // @IsOptional()
  // last_active?: string;
}
