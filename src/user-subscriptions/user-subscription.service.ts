import { Injectable } from '@nestjs/common';
import { UserSubscriptionRepositoryAbstract } from './infrastructure/persistence/document/repositories/user-subscription.repository.abstract';
import { UserSubscription } from './domain/user-subscription';

@Injectable()
export class UserSubscriptionService {
  constructor(
    private readonly userSubscriptionRepository: UserSubscriptionRepositoryAbstract,
  ) {}

  async createSubscription(
    data: Omit<UserSubscription, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<UserSubscription> {
    return this.userSubscriptionRepository.create(data);
  }

  async getSubscriptionById(id: string): Promise<UserSubscription | null> {
    return this.userSubscriptionRepository.findById(id);
  }

  async getAllSubscriptions(): Promise<UserSubscription[]> {
    return this.userSubscriptionRepository.findAll();
  }

  async updateSubscription(
    id: string,
    data: Partial<UserSubscription>,
  ): Promise<UserSubscription | null> {
    return this.userSubscriptionRepository.update(id, data);
  }

  async deleteSubscription(id: string): Promise<void> {
    return this.userSubscriptionRepository.delete(id);
  }

  async findByUserId(userId: string): Promise<UserSubscription[]> {
    return this.userSubscriptionRepository.findByUserId(userId);
  }

  async findActiveSubscription(
    userId: string,
  ): Promise<UserSubscription | null> {
    return this.userSubscriptionRepository.findActiveSubscription(userId);
  }

  async findByUserAndStatus(
    userId: string,
    status: string,
  ): Promise<UserSubscription[]> {
    return this.userSubscriptionRepository.findByUserAndStatus(userId, status);
  }

  async isSubscriptionValid(userId: string): Promise<boolean> {
    const { isPro } = await this.checkSubscriptionStatus(userId);
    return isPro;
  }

  /**
   * Check subscription status with auto-expiry side effect.
   *
   * - If the user has an ACTIVE subscription in DB that has passed its `endDate`
   *   → automatically marks it `EXPIRED` in the database.
   * - Distinguishes between:
   *   - `{ isPro: true }` — valid, still within endDate
   *   - `{ isPro: false, hasExpired: true }` — had Pro but it lapsed; just auto-expired
   *   - `{ isPro: false, hasExpired: false }` — never subscribed to Pro
   */
  async checkSubscriptionStatus(userId: string): Promise<{
    isPro: boolean;
    hasExpired: boolean;
    expiresAt: Date | null;
  }> {
    const sub =
      await this.userSubscriptionRepository.findActiveIgnoreExpiry(userId);

    if (!sub) {
      return { isPro: false, hasExpired: false, expiresAt: null };
    }

    const now = new Date();
    if (sub.endDate <= now) {
      // Subscription is ACTIVE in DB but has already passed its endDate.
      // Auto-expire it so the DB stays consistent.
      await this.expireSubscription(sub.id);
      return { isPro: false, hasExpired: true, expiresAt: sub.endDate };
    }

    return { isPro: true, hasExpired: false, expiresAt: sub.endDate };
  }

  async expireSubscription(id: string): Promise<UserSubscription | null> {
    return this.userSubscriptionRepository.expireSubscription(id);
  }
}
