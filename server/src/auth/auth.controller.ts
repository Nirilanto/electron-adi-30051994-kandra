import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { AuthService } from './auth.service';
import { Public } from '../common/decorators/public.decorator';
import { AuthUser, CurrentUser } from '../common/decorators/current-user.decorator';

class LoginDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @IsString()
  @MinLength(1, { message: 'Mot de passe requis' })
  password: string;
}

class SetupDto {
  @IsEmail({}, { message: 'Adresse email invalide' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  password: string;

  @IsString()
  @MinLength(1, { message: 'Nom requis' })
  name: string;
}

class ChangePasswordDto {
  @IsString()
  currentPassword: string;

  @IsString()
  @MinLength(8, { message: 'Le mot de passe doit contenir au moins 8 caractères' })
  newPassword: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Get('status')
  status() {
    return this.auth.status();
  }

  @Public()
  @Post('setup')
  setup(@Body() dto: SetupDto) {
    return this.auth.setup(dto.email.toLowerCase().trim(), dto.password, dto.name.trim());
  }

  @Public()
  @HttpCode(200)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto.email.toLowerCase().trim(), dto.password);
  }

  @Get('me')
  me(@CurrentUser() user: AuthUser) {
    return user;
  }

  @HttpCode(200)
  @Post('change-password')
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.auth.changePassword(user.id, dto.currentPassword, dto.newPassword);
  }
}
