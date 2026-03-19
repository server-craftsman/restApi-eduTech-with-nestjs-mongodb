import { Controller, Get, Param } from '@nestjs/common';
import { SessionService } from './session.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags(
  'Sessions - This controller should NOT be called directly. Use the AuthService REVOKE METHODS instead.',
)
@Controller('sessions')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Get('user/:userId')
  async getSessionsByUserId(@Param('userId') userId: string) {
    return this.sessionService.findSessionsByUserId(userId);
  }

  @Get(':id')
  async getSessionById(@Param('id') id: string) {
    return this.sessionService.findSessionById(id);
  }

  // @Delete(':id')
  // async deleteSession(@Param('id') id: string) {
  //   await this.sessionService.deleteSession(id);
  //   return { message: 'Session deleted successfully' };
  // }

  // @Delete('user/:userId/all')
  // async deleteAllUserSessions(@Param('userId') userId: string) {
  //   await this.sessionService.deleteSessionsByUserId(userId);
  //   return { message: 'All user sessions deleted' };
  // }
}
