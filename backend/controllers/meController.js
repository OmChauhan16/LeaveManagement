/**
 * Candidate-facing controller for:
 * - viewing balances
 * - viewing own requests
 * - creating a leave request (with file upload)
 * - viewing a request detail
 *
 * Validation enforces document rules and prevents negative balances.
 */
import { pool } from '../db.js';
import { workingDaysBetween, yearOf } from '../utils/dates.js';
import { getOrCreateEntitlements } from '../services/entitlementService.js';
import { logAudit } from '../services/auditService.js';
import { dirname, join } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from 'url';

export async function myBalances(req, res) {
  const year = Number(req.query.year) || new Date().getFullYear();
  const ent = await getOrCreateEntitlements(req.user.id, year);
  const [usedRows] = await pool.query(
    `SELECT category, COALESCE(SUM(working_days),0) as used
     FROM leave_requests
     WHERE user_id=? AND status='approved' AND YEAR(start_date)=? 
     GROUP BY category`, [req.user.id, year]);

  const used = { CL: 0, SL: 0, EL: 0, ML: 0 };
  for (const r of usedRows) used[r.category] = Number(r.used);
  const remaining = {
    CL: Math.max(0, ent.cl - used.CL),
    SL: Math.max(0, ent.sl - used.SL),
    EL: Math.max(0, ent.el - used.EL),
    ML: Math.max(0, ent.ml - used.ML)
  };
  res.json({ year, entitlement: ent, used, remaining });
}

export async function myRequests(req, res) {
  const [rows] = await pool.query('SELECT * FROM leave_requests WHERE user_id=? ORDER BY created_at DESC', [req.user.id]);
  // res.json(rows);
  

  // Construct full file path or URL for the frontend
  const basePath = 'http://localhost:4000/backend/uploads/';
  const requestsWithDocument = rows.map(row => ({
    ...row,
    document: row.document_path ? `${basePath}${row.document_path}` : null, // Convert path to full URL
  }));

  res.json(requestsWithDocument);

}

export async function createRequest(req, res) {
  const { category, startDate, endDate, reason } = req.body;
  if (!category || !startDate || !endDate) return res.status(400).json({ error: 'Missing fields' });
  if (!['CL', 'SL', 'EL', 'ML'].includes(category)) return res.status(400).json({ error: 'Invalid category' });

  let workingDays;
  try { workingDays = workingDaysBetween(startDate, endDate); } catch (e) { return res.status(400).json({ error: e.message }); }
  if (workingDays <= 0) return res.status(400).json({ error: 'Zero working days range' });

  // Document rules
  const needsDoc = (category === 'ML') || (category === 'SL' && workingDays > 2);
  if (needsDoc && !req.file) return res.status(400).json({ error: `Document required for ${category} (${workingDays} working days)` });

  const year = yearOf(startDate);
  const ent = await getOrCreateEntitlements(req.user.id, year);
  const [usedMap] = await pool.query(
    `SELECT COALESCE(SUM(working_days),0) AS used
     FROM leave_requests 
     WHERE user_id=? AND status='approved' AND YEAR(start_date)=? AND category=?`,
    [req.user.id, year, category]);
  const used = Number(usedMap[0].used);
  const entVal = { CL: ent.cl, SL: ent.sl, EL: ent.el, ML: ent.ml }[category];
  const remaining = entVal - used;

  if (remaining < workingDays) {
    return res.status(400).json({ error: remaining <= 0 ? `No balance left for ${category} leave` : `Only ${remaining} day(s) remaining for ${category}` });
  }

  const docPath = req.file ? `/uploads/${req.file.filename}` : null;
  const [result] = await pool.query(
    `INSERT INTO leave_requests (user_id, category, start_date, end_date, working_days, reason, document_path, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')`,
    [req.user.id, category, startDate, endDate, workingDays, reason || null, docPath]);
  await logAudit(req.user.id, 'request_created', 'leave_requests', result.insertId, `Category ${category}, ${workingDays} day(s)`);
  const [rows] = await pool.query('SELECT * FROM leave_requests WHERE id=?', [result.insertId]);
  res.json(rows[0]);
}

export async function requestDetail(req, res) {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM leave_requests WHERE id=? AND user_id=?', [id, req.user.id]);
  if (!rows.length) return res.status(404).json({ error: 'Not found' });
  res.json(rows[0]);
}


export async function getDocument(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await pool.query('SELECT document_path FROM leave_requests WHERE id = ?', [id]);
    if (!rows[0] || !rows[0].document_path) {
      return res.status(404).json({ error: 'Document not found' });
    }
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    const filePath = join(__dirname, '..', 'backend', rows[0].document_path);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }
    res.download(filePath);
  } catch (error) {
    console.error('Error serving document:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
}