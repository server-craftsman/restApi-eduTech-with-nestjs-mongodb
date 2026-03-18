/**
 * Base Update DTO - Minimal/empty base class
 * Use this for full updates (PUT) where all fields are optional
 *
 * Update DTOs should:
 * - Make all fields optional (as opposed to Create DTOs which require fields)
 * - NOT include id, createdAt, updatedAt, isDeleted, deletedAt (immutable)
 * - Use @ApiPropertyOptional() for all fields
 *
 * @example
 * export class UpdateUserDto extends BaseUpdateDto {
 *   @IsOptional()
 *   @IsEmail()
 *   email?: string;
 *
 *   @IsOptional()
 *   @IsString()
 *   displayName?: string;
 * }
 */
export class BaseUpdateDto {}

/**
 * Base Patch DTO - for partial updates (PATCH)
 * Same as BaseUpdateDto but semantically indicates a partial update
 *
 * @example
 * export class PatchUserDto extends BasePatchDto {
 *   @IsOptional()
 *   @IsString()
 *   avatarUrl?: string;
 * }
 */
export class BasePatchDto {}
