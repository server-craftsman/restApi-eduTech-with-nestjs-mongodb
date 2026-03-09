import { UserSubscription } from '../../../../domain/user-subscription';

export abstract class UserSubscriptionRepositoryAbstract {
  abstract findById(id: string): Promise<UserSubscription | null>;
  abstract findAll(): Promise<UserSubscription[]>;
  abstract create(
    data: Omit<UserSubscription, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<UserSubscription>;
  abstract update(
    id: string,
    data: Partial<UserSubscription>,
  ): Promise<UserSubscription | null>;
  abstract delete(id: string): Promise<void>;
  abstract findByUserId(userId: string): Promise<UserSubscription[]>;
  abstract findActiveSubscription(
    userId: string,
  ): Promise<UserSubscription | null>;
  abstract findByUserAndStatus(
    userId: string,
    status: string,
  ): Promise<UserSubscription[]>;
  abstract expireSubscription(id: string): Promise<UserSubscription | null>;
  /**
   * Find an ACTIVE subscription for the user ignoring endDate.
   * Used to detect subscriptions that have ACTIVE status in DB but are past their endDate.
   */
  abstract findActiveIgnoreExpiry(
    userId: string,
  ): Promise<UserSubscription | null>;
}
