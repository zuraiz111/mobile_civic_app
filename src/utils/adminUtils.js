/**
 * adminUtils.js
 * Shared utilities for the admin panel.
 * Centralizes status normalization, department icon mapping,
 * and Firestore Timestamp formatting so every screen uses one source of truth.
 */

// ─────────────────────────────────────────────
// STATUS NORMALIZATION
// Citizen app writes lowercase ("pending").
// Admin UI displays title-case ("Pending").
// This util lets both coexist without mismatches.
// ─────────────────────────────────────────────

/** Canonical title-case statuses used for display & Firestore writes from admin */
export const STATUS_PENDING    = 'pending';
export const STATUS_ASSIGNED   = 'assigned';
export const STATUS_IN_PROGRESS = 'inProgress';
export const STATUS_RESOLVED   = 'resolved';
export const STATUS_CLOSED     = 'closed';

/**
 * Normalizes any status string the citizen app or admin might write
 * into a single lowercase canonical key used for matching.
 *   "Pending"     → "pending"
 *   "In Progress" → "inProgress"
 *   "inProgress"  → "inProgress"
 *   "assigned"    → "assigned"
 */
export function normalizeStatus(raw) {
  if (!raw) return STATUS_PENDING;
  const map = {
    pending:     STATUS_PENDING,
    assigned:    STATUS_ASSIGNED,
    'in progress': STATUS_IN_PROGRESS,
    inprogress:  STATUS_IN_PROGRESS,
    resolved:    STATUS_RESOLVED,
    closed:      STATUS_CLOSED,
  };
  return map[raw.toLowerCase().replace(/\s+/g, ' ')] || raw.toLowerCase();
}

/**
 * Human-readable display label for a status key.
 * Pass through t() in the component for i18n if needed.
 */
export function statusDisplayLabel(status) {
  const labels = {
    pending:    'Pending',
    assigned:   'Assigned',
    inProgress: 'In Progress',
    resolved:   'Resolved',
    closed:     'Closed',
  };
  return labels[normalizeStatus(status)] || status;
}

import { departments } from '../data/departments';

// ─────────────────────────────────────────────
// DEPARTMENT → ICON MAPPING
// Each department has a canonical emoji icon + a tint color.
// We derive this from the central departments.js file to ensure consistency.
// ─────────────────────────────────────────────

export const DEPARTMENT_ICONS = departments.reduce((acc, dept) => {
  // We use both ID and name as keys (lowercase) for robustness
  acc[dept.id.toLowerCase()] = { icon: dept.icon, color: dept.color };
  acc[dept.name.toLowerCase()] = { icon: dept.icon, color: dept.color };
  return acc;
}, {
  // Additional manual mappings for admin-specific terms or variations
  'sanitation': { icon: '🗑️', color: '#22c55e' },
  'animal rescue': { icon: '🐾', color: '#f59e0b' },
  'parks': { icon: '🌳', color: '#22c55e' },
  'health': { icon: '🏥', color: '#ef4444' },
  'education': { icon: '🎓', color: '#8b5cf6' },
  'public safety': { icon: '🛡️', color: '#ec4899' },
});

const FALLBACK_ICON = { icon: '❓', color: '#6366f1' };

/**
 * Given a department name (or object with .name), return { icon, color }.
 * Note: icon is now an emoji string as requested by the user.
 */
export function getDeptIcon(nameOrObj) {
  const name = typeof nameOrObj === 'string' ? nameOrObj : nameOrObj?.name || '';
  if (!name) return FALLBACK_ICON;
  
  const normalizedName = name.toLowerCase().trim();
  return DEPARTMENT_ICONS[normalizedName] || FALLBACK_ICON;
}

// ─────────────────────────────────────────────
// FIRESTORE TIMESTAMP → JS Date
// createdAt from Firestore can be:
//   • a Firestore Timestamp object  → has .toDate()
//   • a plain object { seconds, nanoseconds } → multiply seconds * 1000
//   • an ISO string or number       → new Date(value)
// ─────────────────────────────────────────────

export function toJSDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();   // Firestore Timestamp
  if (value.seconds != null)             return new Date(value.seconds * 1000); // plain object
  return new Date(value);                                          // string / number
}

export function formatDate(value) {
  const d = toJSDate(value);
  if (!d || isNaN(d.getTime())) return 'N/A';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(value) {
  const d = toJSDate(value);
  if (!d || isNaN(d.getTime())) return 'N/A';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// ─────────────────────────────────────────────
// STATUS COLORS (used in badges, banners, progress bars)
// ─────────────────────────────────────────────

export const STATUS_COLORS = {
  pending:    { bg: '#fef3c7', text: '#92400e' },   // amber
  assigned:   { bg: '#dbeafe', text: '#1e40af' },   // blue
  inProgress: { bg: '#e0e7ff', text: '#3730a3' },   // indigo
  resolved:   { bg: '#d1fae5', text: '#065f46' },   // green
  closed:     { bg: '#f3f4f6', text: '#374151' },   // gray
};

export function getStatusStyle(rawStatus) {
  return STATUS_COLORS[normalizeStatus(rawStatus)] || STATUS_COLORS.pending;
}
