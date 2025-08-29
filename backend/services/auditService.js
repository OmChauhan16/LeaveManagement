/**
 * Audit service records important actions in the audit_log table.
 * This provides an append-only trail of events for compliance and debugging.
 */
import { pool } from '../db.js';

export async function logAudit(actorUserId, action, entityType=null, entityId=null, note=null) {
  await pool.query(
    'INSERT INTO audit_log (actor_user_id, action, entity_type, entity_id, note) VALUES (?,?,?,?,?)',
    [actorUserId || null, action, entityType || null, entityId || null, note || null]
  );
}
