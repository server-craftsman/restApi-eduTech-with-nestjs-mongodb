import { BadRequestException, Injectable } from '@nestjs/common';
import { ParentStudentLinkRepositoryAbstract } from './infrastructure/persistence/document/repositories/parent-student-link.repository.abstract';
import { ParentStudentLink } from './domain/parent-student-link';
import { StudentProfileService } from '../student-profiles/student-profile.service';
import { ParentProfileService } from '../parent-profiles/parent-profile.service';
import { LinkedStudentDto } from './dto/linked-student.dto';
import { LinkedParentDto } from './dto/linked-parent.dto';
import { GenerateLinkCodeResponseDto } from './dto/generate-link-code-response.dto';

@Injectable()
export class ParentStudentLinkService {
  constructor(
    private readonly parentStudentLinkRepository: ParentStudentLinkRepositoryAbstract,
    private readonly studentProfileService: StudentProfileService,
    private readonly parentProfileService: ParentProfileService,
  ) {}

  async createLink(
    data: Omit<ParentStudentLink, 'id' | 'createdAt'>,
  ): Promise<ParentStudentLink> {
    return this.parentStudentLinkRepository.create(data);
  }

  async getLinkById(id: string): Promise<ParentStudentLink | null> {
    return this.parentStudentLinkRepository.findById(id);
  }

  async getAllLinks(): Promise<ParentStudentLink[]> {
    return this.parentStudentLinkRepository.findAll();
  }

  async updateLink(
    id: string,
    data: Partial<ParentStudentLink>,
  ): Promise<ParentStudentLink | null> {
    return this.parentStudentLinkRepository.update(id, data);
  }

  async deleteLink(id: string): Promise<void> {
    return this.parentStudentLinkRepository.delete(id);
  }

  async getStudentsByParentId(parentId: string): Promise<ParentStudentLink[]> {
    return this.parentStudentLinkRepository.findByParentId(parentId);
  }

  async getParentsByStudentId(studentId: string): Promise<ParentStudentLink[]> {
    return this.parentStudentLinkRepository.findByStudentId(studentId);
  }

  async getLinkByParentAndStudent(
    parentId: string,
    studentId: string,
  ): Promise<ParentStudentLink | null> {
    return this.parentStudentLinkRepository.findByParentAndStudent(
      parentId,
      studentId,
    );
  }

  async getVerifiedStudentsByParentId(
    parentId: string,
  ): Promise<ParentStudentLink[]> {
    return this.parentStudentLinkRepository.findVerifiedByParentId(parentId);
  }

  async getVerifiedParentsByStudentId(
    studentId: string,
  ): Promise<ParentStudentLink[]> {
    return this.parentStudentLinkRepository.findVerifiedByStudentId(studentId);
  }

  async verifyLink(id: string): Promise<ParentStudentLink | null> {
    return this.updateLink(id, { isVerified: true });
  }

  async filterLinks(
    filters: Partial<ParentStudentLink>,
  ): Promise<ParentStudentLink[]> {
    const allLinks = await this.getAllLinks();
    return allLinks.filter((link) => {
      if (filters.parentId && link.parentId !== filters.parentId) return false;
      if (filters.studentId && link.studentId !== filters.studentId)
        return false;
      if (
        filters.isVerified !== undefined &&
        link.isVerified !== filters.isVerified
      )
        return false;
      return true;
    });
  }

  // ─── Parent Linking Flow ──────────────────────────────────────────────────

  /**
   * Step 1 (Student): Generate a unique 8-character link code.
   * Creates an unverified link record associated with the student profile.
   * If an unexpired pending code already exists, it is returned as-is.
   *
   * @param studentUserId - The authenticated student's userId (from JWT)
   */
  async generateLinkCode(
    studentUserId: string,
  ): Promise<GenerateLinkCodeResponseDto> {
    const studentProfile =
      await this.studentProfileService.getProfileByUserId(studentUserId);
    if (!studentProfile) {
      throw new BadRequestException('Student profile not found');
    }

    // Return existing unexpired code if present
    const existing =
      await this.parentStudentLinkRepository.findPendingByStudentId(
        studentProfile.id,
      );
    if (
      existing?.linkCode &&
      existing.linkCodeExpires &&
      existing.linkCodeExpires > new Date()
    ) {
      return {
        linkCode: existing.linkCode,
        expiresAt: existing.linkCodeExpires,
      };
    }

    // Generate a new 8-char uppercase alphanumeric code
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.parentStudentLinkRepository.create({
      parentId: '', // empty until parent connects
      studentId: studentProfile.id,
      isVerified: false,
      linkCode: code,
      linkCodeExpires: expiresAt,
    });

    return { linkCode: code, expiresAt };
  }

  /**
   * Step 2 (Parent): Connect to a student using the link code.
   * Marks the link as verified and stores the parent profile ID.
   *
   * @param parentUserId - The authenticated parent's userId (from JWT)
   * @param code         - The 8-char code obtained from the student
   */
  async connectByCode(
    parentUserId: string,
    code: string,
  ): Promise<ParentStudentLink> {
    const parentProfile =
      await this.parentProfileService.getProfileByUserId(parentUserId);
    if (!parentProfile) {
      throw new BadRequestException('Parent profile not found');
    }

    const link = await this.parentStudentLinkRepository.findByLinkCode(code);
    if (!link) {
      throw new BadRequestException('Invalid link code');
    }
    if (link.isVerified) {
      throw new BadRequestException('This link code has already been used');
    }
    if (!link.linkCodeExpires || link.linkCodeExpires < new Date()) {
      throw new BadRequestException('Link code has expired');
    }

    // Check for duplicate link between same parent and student
    const duplicate =
      await this.parentStudentLinkRepository.findByParentAndStudent(
        parentProfile.id,
        link.studentId,
      );
    if (duplicate && duplicate.isVerified) {
      throw new BadRequestException('You are already linked to this student');
    }

    const updated = await this.parentStudentLinkRepository.update(link.id, {
      parentId: parentProfile.id,
      isVerified: true,
      linkCode: null,
      linkCodeExpires: null,
    });

    return updated!;
  }

  /**
   * Returns all verified children with their student profile details.
   *
   * @param parentUserId - The authenticated parent's userId (from JWT)
   */
  async getMyChildren(parentUserId: string): Promise<LinkedStudentDto[]> {
    const parentProfile =
      await this.parentProfileService.getProfileByUserId(parentUserId);
    if (!parentProfile) return [];

    const links = await this.parentStudentLinkRepository.findVerifiedByParentId(
      parentProfile.id,
    );

    const results: LinkedStudentDto[] = [];
    for (const link of links) {
      const profile = await this.studentProfileService.getProfileById(
        link.studentId,
      );
      if (!profile) continue;
      results.push({
        linkId: link.id,
        studentProfileId: profile.id,
        fullName: profile.fullName,
        gradeLevel: profile.gradeLevel ?? null,
        schoolName: profile.schoolName ?? null,
        xpTotal: profile.xpTotal,
        currentStreak: profile.currentStreak,
        linkedAt: link.createdAt,
      });
    }
    return results;
  }

  /**
   * Returns all verified parents with their parent profile details.
   *
   * @param studentUserId - The authenticated student's userId (from JWT)
   */
  async getMyParents(studentUserId: string): Promise<LinkedParentDto[]> {
    const studentProfile =
      await this.studentProfileService.getProfileByUserId(studentUserId);
    if (!studentProfile) return [];

    const links =
      await this.parentStudentLinkRepository.findVerifiedByStudentId(
        studentProfile.id,
      );

    const results: LinkedParentDto[] = [];
    for (const link of links) {
      const profile = await this.parentProfileService.getProfileById(
        link.parentId,
      );
      if (!profile) continue;
      results.push({
        linkId: link.id,
        parentProfileId: profile.id,
        fullName: profile.fullName,
        phoneNumber: profile.phoneNumber,
        linkedAt: link.createdAt,
      });
    }
    return results;
  }
}
