/**
 * Authentication controller:
 * - POST /auth/login  -> returns JWT
 * - POST /auth/register-via-invite -> completes signup for an invite token
 *
 * Uses bcrypt for hashing and verifies invite tokens from invites table.
 */
import { pool } from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import dayjs from 'dayjs';
import { logAudit } from '../services/auditService.js';
dotenv.config();

function sign(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || '1h'
  });
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Missing fields' });
  const [rows] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
  if (!rows.length) return res.status(400).json({ error: 'Invalid credentials' });
  const user = rows[0];
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return res.status(400).json({ error: 'Invalid credentials' });
  const token = sign(user);
  res.json({ token, user: { id:user.id, email:user.email, name:user.name, role:user.role } });
}

export async function registerViaInvite(req, res) {
  const { token, name, password } = req.body;
  if (!token || !name || !password) return res.status(400).json({ error: 'Missing fields' });
  const [invRows] = await pool.query('SELECT * FROM invites WHERE token=?', [token]);
  if (!invRows.length) return res.status(400).json({ error: 'Invalid invite token' });
  const invite = invRows[0];
  if (invite.used) return res.status(400).json({ error: 'Invite already used' });
  if (dayjs().isAfter(dayjs(invite.expires_at))) return res.status(400).json({ error: 'Invite expired' });

  const [exists] = await pool.query('SELECT id FROM users WHERE email=?', [invite.email]);
  if (exists.length) return res.status(400).json({ error: 'User already exists for this email' });

  const hash = await bcrypt.hash(password, 10);
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, "candidate")',
    [name, invite.email, hash]
  );
  await pool.query('UPDATE invites SET used=1 WHERE id=?', [invite.id]);
  await logAudit(result.insertId, 'invite_accepted', 'invite', invite.id, `User registered: ${invite.email}`);

  const [userRows] = await pool.query('SELECT * FROM users WHERE id=?', [result.insertId]);
  const user = userRows[0];
  const jwtToken = sign(user);
  res.json({ token: jwtToken, user: { id:user.id, email:user.email, name:user.name, role:user.role } });
}
