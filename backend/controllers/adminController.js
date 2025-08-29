/**
 * Admin controller handles:
 * - invite CRUD (create/resend/revoke/list)
 * - listing users (candidates)
 * - listing and filtering leave requests
 * - approving/rejecting requests
 * - entitlements management
 *
 * All endpoints are protected by auth + requireRole('admin') middleware.
 */
import { pool } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';
import { getOrCreateEntitlements } from '../services/entitlementService.js';
import { logAudit } from '../services/auditService.js';
import { sendInviteEmail } from '../services/emailService.js';
import { dirname, join } from "path";
import { existsSync } from "fs";
import { fileURLToPath } from 'url';

export async function listInvites(req, res) {
  const [rows] = await pool.query('SELECT * FROM invites ORDER BY created_at DESC');
  res.json(rows);
}

export async function createInvite(req, res) {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  const token = uuidv4();
  const expires = dayjs().add(7, 'day').format('YYYY-MM-DD HH:mm:ss');
  const [result] = await pool.query(
    'INSERT INTO invites (email, token, expires_at, created_by_admin_id) VALUES (?,?,?,?)',
    [email, token, expires, req.user.id]
  );
  const frontendBaseUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  const link = `${frontendBaseUrl}/register?token=${token}`;
  try {
    await sendInviteEmail(email, link);
  } catch (e) {
    console.warn('Failed to send invite email:', e.message);
  }
  await logAudit(req.user.id, 'invite_sent', 'invite', result.insertId, `Email: ${email}`);
  res.json({ id: result.insertId, email, token, link, expires_at: expires });
}

export async function resendInvite(req, res) {
  const { id } = req.params;
  const [rows] = await pool.query('SELECT * FROM invites WHERE id=?', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Invite not found' });
  const inv = rows[0];
  const link = `${req.protocol}://${req.get('host')}/register?token=${inv.token}`;
  try { await sendInviteEmail(inv.email, link); } catch (e) { console.warn('resend failed', e.message); }
  await logAudit(req.user.id, 'invite_resent', 'invite', id, null);
  res.json({ ok: true });
}

export async function revokeInvite(req, res) {
  const { id } = req.params;
  await pool.query('UPDATE invites SET used=1 WHERE id=?', [id]);
  await logAudit(req.user.id, 'invite_revoked', 'invite', id, null);
  res.json({ ok: true });
}

export async function listUsers(req, res) {
  const role = req.query.role || 'candidate';
  const [rows] = await pool.query('SELECT id, name, email, role, created_at FROM users WHERE role=? ORDER BY created_at DESC', [role]);
  res.json(rows);
}


export async function listRequests(req, res) {
  const { status, from, to, candidateId } = req.query;
  const clauses = [];
  const params = [];
  if (status) { clauses.push('lr.status=?'); params.push(status); }
  if (from) { clauses.push('lr.start_date>=?'); params.push(from); }
  if (to) { clauses.push('lr.end_date<=?'); params.push(to); }
  if (candidateId) { clauses.push('lr.user_id=?'); params.push(candidateId); }

  const where = clauses.length ? 'WHERE ' + clauses.join(' AND ') : '';
  const [rows] = await pool.query(
    `SELECT lr.*, u.name as candidate_name, u.email as candidate_email, lr.document_path as document
     FROM leave_requests lr
     JOIN users u ON u.id=lr.user_id
     ${where}
     ORDER BY lr.created_at DESC`, params);
     

  // Construct full file path or URL for the frontend
  const basePath = 'http://localhost:4000/backend/uploads/'; 
  const requestsWithDocument = rows.map(row => ({
    ...row,
    document: row.document ? `${basePath}${row.document}` : null, // Convert path to full URL
  }));

  res.json(requestsWithDocument);
}

export async function approveRequest(req, res) {
  const { id } = req.params;
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ error: 'Comment required' });
  const [rows] = await pool.query('SELECT * FROM leave_requests WHERE id=?', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Request not found' });
  const lr = rows[0];
  if (lr.status !== 'pending') return res.status(400).json({ error: 'Only pending can be approved' });

  await pool.query('UPDATE leave_requests SET status="approved", admin_comment=? WHERE id=?', [comment, id]);
  await logAudit(req.user.id, 'request_approved', 'leave_requests', id, comment);
  res.json({ ok: true });
}

export async function rejectRequest(req, res) {
  const { id } = req.params;
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ error: 'Comment required' });
  const [rows] = await pool.query('SELECT * FROM leave_requests WHERE id=?', [id]);
  if (!rows.length) return res.status(404).json({ error: 'Request not found' });
  const lr = rows[0];
  if (lr.status !== 'pending') return res.status(400).json({ error: 'Only pending can be rejected' });

  await pool.query('UPDATE leave_requests SET status="rejected", admin_comment=? WHERE id=?', [comment, id]);
  await logAudit(req.user.id, 'request_rejected', 'leave_requests', id, comment);
  res.json({ ok: true });
}

export async function getEntitlements(req, res) {
  const year = Number(req.query.year) || new Date().getFullYear();
  const ent = await getOrCreateEntitlements(req.params.userId, year);
  res.json(ent);
}

export async function setEntitlements(req, res) {
  const { year, cl, sl, el, ml } = req.body;
  if (!year) return res.status(400).json({ error: 'year required' });
  const ent = await getOrCreateEntitlements(req.params.userId, year);
  await pool.query('UPDATE entitlements SET cl=?, sl=?, el=?, ml=? WHERE id=?', [
    Number(cl ?? ent.cl),
    Number(sl ?? ent.sl),
    Number(el ?? ent.el),
    Number(ml ?? ent.ml),
    ent.id
  ]);
  await logAudit(req.user.id, 'entitlement_changed', 'entitlements', ent.id, JSON.stringify({ year, cl, sl, el, ml }));
  const [rows] = await pool.query('SELECT * FROM entitlements WHERE id=?', [ent.id]);
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