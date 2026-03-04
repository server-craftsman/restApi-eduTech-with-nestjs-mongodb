# Profile DTOs Update - Approval Workflow Fields

**Date**: March 4, 2026  
**Status**: ✅ Completed

## Summary

Updated all profile DTOs (Create + Update) for `student-profiles`, `teacher-profiles`, and `parent-profiles` modules to match the expanded domain schemas that support the Teacher/Parent approval workflow.

---

## Changes by Module

### 1. Teacher Profile DTOs

#### Fields Added to `CreateTeacherProfileDto` + `UpdateTeacherProfileDto`

| Field | Type | Required | Description |
|---|---|---|---|
| `phoneNumber` | `string \| null` | Optional | Phone number for admin contact and verification |
| `subjectsTaught` | `string[]` | Optional | List of subjects the teacher is qualified to teach |
| `yearsOfExperience` | `number \| null` | Optional | Number of years of teaching experience (0-60) |
| `educationLevel` | `TeacherEducationLevel \| null` | Optional | Highest education level (Bachelor/Master/PhD/Other) |
| `certificateUrls` | `string[]` | Optional | URLs of uploaded teaching certificates/credentials |
| `cvUrl` | `string \| null` | Optional | URL of uploaded CV/résumé document |
| `linkedinUrl` | `string \| null` | Optional | LinkedIn profile URL |

**Validation**:
- `yearsOfExperience`: `@Min(0)` `@Max(60)` `@Type(() => Number)`
- `educationLevel`: `@IsEnum(TeacherEducationLevel)`
- `subjectsTaught`, `certificateUrls`: `@IsArray()` `@IsString({ each: true })`

---

### 2. Parent Profile DTOs

#### Fields Added to `CreateParentProfileDto` + `UpdateParentProfileDto`

| Field | Type | Required | Description |
|---|---|---|---|
| `relationship` | `ParentRelationship \| null` | Optional | Relationship to student (Father/Mother/Guardian/Other) |
| `nationalIdNumber` | `string \| null` | Optional | National ID card number (CCCD/CMND) for identity verification |
| `nationalIdImageUrl` | `string \| null` | Optional | URL of uploaded national ID card image |

**Validation**:
- `relationship`: `@IsEnum(ParentRelationship)`

---

### 3. Student Profile DTOs

**No changes** — student profile DTOs already match the domain schema (no new approval fields for students).

---

## File Changes

### Modified Files

```
✅ src/teacher-profiles/dto/create-teacher-profile.dto.ts
✅ src/teacher-profiles/dto/update-teacher-profile.dto.ts
✅ src/parent-profiles/dto/create-parent-profile.dto.ts
✅ src/parent-profiles/dto/update-parent-profile.dto.ts
```

### Imports Added

**Teacher Profile DTOs**:
```typescript
import { Type } from 'class-transformer';
import { TeacherEducationLevel } from '../../enums';
// Added validators: IsArray, IsNumber, Min, Max, IsEnum
```

**Parent Profile DTOs**:
```typescript
import { ParentRelationship } from '../../enums';
// Added validator: IsEnum
```

---

## Integration Points

These updated DTOs are now used by:

1. **Manual profile creation** (`POST /teacher-profiles`, `POST /parent-profiles`)
2. **Profile updates** (`PUT /teacher-profiles/:id`, `PUT /parent-profiles/:id`)
3. **Auth registration flow** (`POST /auth/email/register`) — SignUpDto uses `@ValidateIf` for role-specific required fields
4. **Admin user creation** (`POST /users`) — CreateUserDto uses `@ValidateIf` for role-specific required fields
5. **OAuth two-step flow** (`POST /auth/oauth/complete-profile`) — CompleteOAuthProfileDto uses `@ValidateIf` for role-specific required fields
6. **Approval resubmission** (`POST /auth/resubmit-approval`) — ResubmitApprovalDto nests these DTOs

---

## Validation Status

- ✅ `npx tsc --noEmit` → 0 errors
- ✅ All DTOs properly typed with class-validator decorators
- ✅ Swagger `@ApiPropertyOptional` with `enumName` for all enums
- ✅ Consistent with domain schemas

---

## Next Steps (Optional)

1. **Response DTOs**: Consider creating dedicated `TeacherProfileDto` / `ParentProfileDto` response DTOs mirroring the domain interface (currently controllers return domain objects directly)
2. **Filtered response**: Add `@Exclude()` decorator on sensitive fields (e.g., `nationalIdNumber`, `nationalIdImageUrl`) when returning profiles to non-admin users
3. **File uploads**: Implement endpoints for uploading `certificateUrls`, `cvUrl`, `nationalIdImageUrl` (currently these are URL strings that must be pre-uploaded to storage)

---

## Related Documentation

- [Approval Flow Workflow](./APPROVAL_FLOW.md) _(to be created)_
- [Security & Recovery Flow](./SECURITY_RECOVERY_FLOW.md)
- [Module Organization Rules](../tech/MODULE_RULES.md)
