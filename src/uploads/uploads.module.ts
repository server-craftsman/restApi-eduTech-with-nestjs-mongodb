import { Module } from '@nestjs/common';
import { StorageModule } from '../storage/storage.module';
import { UploadsService } from './uploads.service';
import { UploadsController } from './uploads.controller';

@Module({
  imports: [StorageModule],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class UploadsModule {}
