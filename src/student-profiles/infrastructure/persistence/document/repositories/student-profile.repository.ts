import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, UpdateQuery } from 'mongoose';
import {
  StudentProfileDocument,
  StudentProfileDocumentType,
} from '../schemas/student-profile.schema';
import { StudentProfileRepositoryAbstract } from './student-profile.repository.abstract';
import { StudentProfileMapper } from '../mappers/student-profile.mapper';
import { StudentProfile } from '../../../../domain/student-profile';
import { BadgeType } from '../../../../../enums';

@Injectable()
export class StudentProfileRepository implements StudentProfileRepositoryAbstract {
  constructor(
    @InjectModel(StudentProfileDocument.name)
    private readonly studentProfileModel: Model<StudentProfileDocumentType>,
    private readonly mapper: StudentProfileMapper,
  ) {}

  async findById(id: string): Promise<StudentProfile | null> {
    const doc = await this.studentProfileModel.findById(id);
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async findAll(): Promise<StudentProfile[]> {
    const docs = await this.studentProfileModel.find();
    return this.mapper.toDomainArray(docs);
  }

  async create(
    data: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<StudentProfile> {
    const doc = await this.studentProfileModel.create({
      userId: new Types.ObjectId(data.userId),
      fullName: data.fullName,
      gender: data.gender ?? null,
      dateOfBirth: data.dateOfBirth ?? null,
      schoolName: data.schoolName ?? null,
      gradeLevel: data.gradeLevel ?? null,
      preferredSubjectIds: data.preferredSubjectIds ?? [],
      onboardingCompleted: data.onboardingCompleted ?? false,
      diamondBalance: data.diamondBalance,
      xpTotal: data.xpTotal,
      currentStreak: data.currentStreak,
      totalPoints: data.totalPoints ?? 0,
      badges: data.badges ?? [],
    });
    return this.mapper.toDomain(doc);
  }

  async update(
    id: string,
    data: Partial<StudentProfile>,
  ): Promise<StudentProfile | null> {
    const updateData: Record<string, unknown> = {};
    if (data.userId) updateData.userId = new Types.ObjectId(data.userId);
    if (data.fullName) updateData.fullName = data.fullName;
    if (data.gender !== undefined) updateData.gender = data.gender;
    if (data.dateOfBirth) updateData.dateOfBirth = data.dateOfBirth;
    if (data.schoolName !== undefined) updateData.schoolName = data.schoolName;
    if (data.gradeLevel !== undefined) updateData.gradeLevel = data.gradeLevel;
    if (data.preferredSubjectIds !== undefined)
      updateData.preferredSubjectIds = data.preferredSubjectIds;
    if (data.onboardingCompleted !== undefined)
      updateData.onboardingCompleted = data.onboardingCompleted;
    if (data.diamondBalance !== undefined)
      updateData.diamondBalance = data.diamondBalance;
    if (data.xpTotal !== undefined) updateData.xpTotal = data.xpTotal;
    if (data.currentStreak !== undefined)
      updateData.currentStreak = data.currentStreak;
    if (data.totalPoints !== undefined)
      updateData.totalPoints = data.totalPoints;
    if (data.badges !== undefined) updateData.badges = data.badges;

    const doc = await this.studentProfileModel.findByIdAndUpdate(
      id,
      updateData as UpdateQuery<StudentProfileDocumentType>,
      { new: true },
    );
    return doc ? this.mapper.toDomain(doc) : null;
  }

  async delete(id: string): Promise<void> {
    await this.studentProfileModel.findByIdAndDelete(id);
  }

  async findByUserId(userId: string): Promise<StudentProfile | null> {
    const doc = await this.studentProfileModel.findOne({
      userId: new Types.ObjectId(userId),
    });
    return doc ? this.mapper.toDomain(doc) : null;
  }

  /**
   * Atomically increment totalPoints using $inc so concurrent requests
   * never overwrite each other. Returns the updated profile.
   */
  async incrementPoints(
    userId: string,
    points: number,
  ): Promise<StudentProfile | null> {
    const doc = await this.studentProfileModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $inc: { totalPoints: points } },
        { new: true },
      )
      .exec();
    return doc ? this.mapper.toDomain(doc) : null;
  }

  /**
   * Append a badge using $addToSet — idempotent, no duplicates.
   */
  async addBadge(userId: string, badge: BadgeType): Promise<void> {
    await this.studentProfileModel
      .findOneAndUpdate(
        { userId: new Types.ObjectId(userId) },
        { $addToSet: { badges: badge } },
      )
      .exec();
  }
}
