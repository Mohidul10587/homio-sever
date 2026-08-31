import { Body, Controller, Post } from '@nestjs/common';
import { IsNotEmpty, IsString, IsEnum, MinLength } from 'class-validator';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';

class RegisterDto {
  @IsString() @IsNotEmpty() name!: string;
  @IsString() @IsNotEmpty() phone!: string;
  @MinLength(8) password!: string;
  @IsEnum(UserRole) role!: UserRole;
}

class LoginDto {
  @IsString() @IsNotEmpty() phone!: string;
  @IsString() @IsNotEmpty() password!: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('register') register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }
  @Post('login') login(@Body() dto: LoginDto) {
    return this.auth.login(dto.phone, dto.password);
  }
}
