/**
 * Entitlement-related helpers:
 * - getOrCreateEntitlements: ensure entitlements row exists for user/year
 * - approvedDaysByCategory: sum of approved days per category for user/year
 * - remainingFrom: compute remaining per category
 */
import { pool } from '../db.js';

export async function getOrCreateEntitlements(userId, year) {
  const [rows] = await pool.query('SELECT * FROM entitlements WHERE user_id=? AND year=?', [userId, year]);
  if (rows.length) return rows[0];
  await pool.query('INSERT INTO entitlements (user_id, year) VALUES (?, ?)', [userId, year]);
  const [rows2] = await pool.query('SELECT * FROM entitlements WHERE user_id=? AND year=?', [userId, year]);
  return rows2[0];
}

export async function approvedDaysByCategory(userId, year) {
  const [rows] = await pool.query(
    `SELECT category, COALESCE(SUM(working_days),0) as used
     FROM leave_requests
     WHERE user_id=? AND status='approved' AND YEAR(start_date)=? 
     GROUP BY category`, [userId, year]);
  const map = { CL:0, SL:0, EL:0, ML:0 };
  for (const r of rows) map[r.category] = Number(r.used);
  return map;
}

export function remainingFrom(ent, used) {
  return {
    CL: ent.cl - (used.CL||0),
    SL: ent.sl - (used.SL||0),
    EL: ent.el - (used.EL||0),
    ML: ent.ml - (used.ML||0),
  };
}
