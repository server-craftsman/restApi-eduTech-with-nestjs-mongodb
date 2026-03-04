import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import {
  TeacherProfileDocument,
  TeacherProfileDocumentType,
} from '../schemas/teacher-profile.schema';
import { TeacherProfileRepositoryAbstract } from './teacher-profile.repository.abstract';
import { TeacherProfileMapper } from '../mappers/teacher-profile.mapper';
import { TeacherProfile } from '../../../../domain/teacher-profile';

@Injectable()
export class TeacherProfileRepository implements TeacherProfileRepositoryAbstract {
  constructor(
    @InjectModel(TeacherProfileDocument.name)
    private readonly teacherProfileModel: Model<TeacherProfileDocumentType>,
    private readonly mapper: TeacherProfileMapper,
  ) {}

  async findById(id: string): Promise<TeacherProfile | null> {
    const doc = await this.teacherProfileModel.findById(id);
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<TeacherProfile[]> {
    const docs = await this.teacherProfileModel.find();
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<TeacherProfile, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<TeacherProfile> {
    const doc = await this.teacherProfileModel.create({
      userId: new Types.ObjectId(data.userId),
      fullName: data.fullName,
      bio: data.bio ?? null,
      phoneNumber: data.phoneNumber ?? null,
      subjectsTaught: data.subjectsTaught ?? [],
      yearsOfExperience: data.yearsOfExperience ?? null,
      educationLevel: data.educationLevel ?? null,
      certificateUrls: data.certificateUrls ?? [],
      cvUrl: data.cvUrl ?? null,
      linkedinUrl: data.linkedinUrl ?? null,
    });
    return this.mapper.toDomain(doc);
  }

  async update(
    id: string,
    data: Partial<TeacherProfile>,
  ): Promise<TeacherProfile | null> {
    const updateData: Record<string, unknown> = {};
    if (data.userId) updateData.userId = new Types.ObjectId(data.userId);
    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.phoneNumber !== undefined)
      updateData.phoneNumber = data.phoneNumber;
    if (data.subjectsTaught !== undefined)
      updateData.subjectsTaught = data.subjectsTaught;
    if (data.yearsOfExperience !== undefined)
      updateData.yearsOfExperience = data.yearsOfExperience;
    if (data.educationLevel !== undefined)
      updateData.educationLevel = data.educationLevel;
    if (data.certificateUrls !== undefined)
      updateData.certificateUrls = data.certificateUrls;
    if (data.cvUrl !== undefined) updateData.cvUrl = data.cvUrl;
    if (data.linkedinUrl !== undefined)
      updateData.linkedinUrl = data.linkedinUrl;

    const doc = await this.teacherProfileModel.findByIdAndUpdate(
      id,
      updateData as UpdateQuery<TeacherProfileDocumentType>,
      {
        new: true,
      },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.teacherProfileModel.findByIdAndDelete(id);
  }

  async findByUserId(userId: string): Promise<TeacherProfile | null> {
    const doc = await this.teacherProfileModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    return doc ? this.mapper.toDomain(doc) : null;
  }
}
