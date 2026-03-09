import { Injectable, NotFoundException } from '@nestjs/common';
import { StudentProfileRepositoryAbstract } from './infrastructure/persistence/document/repositories/student-profile.repository.abstract';
import { StudentProfile } from './domain/student-profile';
import { CompleteOnboardingDto } from './dto';
import { BadgeType } from '../enums';

@Injectable()
export class StudentProfileService {
  constructor(
    private readonly studentProfileRepository: StudentProfileRepositoryAbstract,
  ) {}

  async createProfile(
    data: Omit<StudentProfile, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<StudentProfile> {
    return this.studentProfileRepository.create(data);
  }

  async getProfileById(id: string): Promise<StudentProfile | null> {
    return this.studentProfileRepository.findById(id);
  }

  async getProfileByUserId(userId: string): Promise<StudentProfile | null> {
    return this.studentProfileRepository.findByUserId(userId);
  }

  async getAllProfiles(): Promise<StudentProfile[]> {
    return this.studentProfileRepository.findAll();
  }

  async updateProfile(
    id: string,
    data: Partial<StudentProfile>,
  ): Promise<StudentProfile | null> {
    return this.studentProfileRepository.update(id, data);
  }

  async deleteProfile(id: string): Promise<void> {
    return this.studentProfileRepository.delete(id);
  }

  async addXp(id: string, xp: number): Promise<StudentProfile | null> {
    const profile = await this.getProfileById(id);
    if (!profile) return null;
    return this.updateProfile(id, {
      ...profile,
      xpTotal: profile.xpTotal + xp,
    });
  }

  async addDiamonds(
    id: string,
    diamonds: number,
  ): Promise<StudentProfile | null> {
    const profile = await this.getProfileById(id);
    if (!profile) return null;
    return this.updateProfile(id, {
      ...profile,
      diamondBalance: profile.diamondBalance + diamonds,
    });
  }

  async updateStreak(
    id: string,
    streak: number,
  ): Promise<StudentProfile | null> {
    const profile = await this.getProfileById(id);
    if (!profile) return null;
    return this.updateProfile(id, { ...profile, currentStreak: streak });
  }

  // ─── Reward helpers (called by RewardService) ─────────────────────────────

  /**
   * Atomically increment the student's totalPoints and return the updated profile.
   * Uses MongoDB $inc — safe under concurrent requests.
   * Returns null if no profile exists for that userId.
   */
  async incrementPoints(
    userId: string,
    points: number,
  ): Promise<StudentProfile | null> {
    return this.studentProfileRepository.incrementPoints(userId, points);
  }

  /**
   * Append a badge to the student's badges array using $addToSet (idempotent).
   */
  async addBadge(userId: string, badge: BadgeType): Promise<void> {
    return this.studentProfileRepository.addBadge(userId, badge);
  }

  // ─── Onboarding ───────────────────────────────────────────────────────────
  /**
   * Called once after registration to record the student's grade level and
   * subject preferences.  Flips `onboardingCompleted` to `true`, which
   * unlocks the full personalised Dashboard.
   *
   * @throws NotFoundException when the student profile does not exist yet.
   */
  async completeOnboarding(
    userId: string,
    dto: CompleteOnboardingDto,
  ): Promise<StudentProfile> {
    const profile = await this.getProfileByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Student profile not found');
    }

    const updated = await this.updateProfile(profile.id, {
      gradeLevel: dto.gradeLevel,
      ...(dto.fullName ? { fullName: dto.fullName } : {}),
      ...(dto.schoolName !== undefined ? { schoolName: dto.schoolName } : {}),
      preferredSubjectIds:
        dto.preferredSubjectIds ?? profile.preferredSubjectIds,
      onboardingCompleted: true,
    });

    // updated is guaranteed non-null because we just confirmed the profile exists
    return updated!;
  }
}
