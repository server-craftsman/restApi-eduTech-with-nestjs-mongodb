import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RolesGuard } from '../roles/roles.guard';
import { UsersModule } from '../users/users.module';
import { StudentProfileModule } from '../student-profiles/student-profile.module';
import { ParentProfileModule } from '../parent-profiles/parent-profile.module';
import { TeacherProfileModule } from '../teacher-profiles/teacher-profile.module';
import { SessionModule } from '../sessions/session.module';
import { EmailVerificationService } from './services/email-verification.service';
import { MailerModule } from '../mailer';

@Module({
  imports: [
    UsersModule,
    StudentProfileModule,
    ParentProfileModule,
    TeacherProfileModule,
    SessionModule,
    PassportModule,
    ConfigModule,
    MailerModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RolesGuard, EmailVerificationService],
  exports: [AuthService],
})
export class AuthModule {}
