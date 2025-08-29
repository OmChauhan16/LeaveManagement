/**
 * Simple seeder that creates an admin user using values from .env
 * If admin already exists, it exits gracefully.
 */
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
dotenv.config();

async function run() {
  const name = process.env.SEED_ADMIN_NAME || 'Admin';
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@example.com';
  const pass = process.env.SEED_ADMIN_PASSWORD || 'admin123';
  const hash = await bcrypt.hash(pass, 10);

  const [exists] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
  if (exists.length) {
    console.log('Admin already exists:', email);
    process.exit(0);
  }
  const [res] = await pool.query('INSERT INTO users (name, email, password_hash, role) VALUES (?,?,?, "admin")', [name, email, hash]);
  console.log('Seeded admin:', { id: res.insertId, email, pass });
  process.exit(0);
}

run().catch(e => { console.error(e); process.exit(1); });
