/**
 * Core DTOs - Base classes for consistent DTO patterns across all modules
 */

// API Response
export * from './api-response.dto';

// Entity Response DTOs
export * from './base-audit.dto';
export * from './base-timestamps.dto';

// CRUD DTOs
export * from './base-create.dto';
export * from './base-update.dto';

// Pagination & Filtering
export * from './base-pagination.dto';
export * from './base-filter.dto';

// Statistics & Aggregation
export * from './base-statistics.dto';
