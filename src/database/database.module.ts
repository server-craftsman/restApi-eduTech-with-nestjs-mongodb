import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri:
          configService.get<string>('database.mongoUri') ??
          configService.get<string>('MONGODB_URI'),
        // Add timeout and error handling for MongoDB connection
        connectTimeoutMS: 30000, // 30 seconds
        serverSelectionTimeoutMS: 30000, // 30 seconds
        socketTimeoutMS: 120000, // 2 minutes
        retryWrites: true,
        maxPoolSize: 10,
        minPoolSize: 1,
      }),
    }),
  ],
})
export class DatabaseModule {}
