import { Router } from 'express';
import { authRequired, requireRole } from '../middleware/auth.js';
import * as adminCtrl from '../controllers/adminController.js';

const router = Router();
router.use(authRequired, requireRole('admin'));

router.get('/invites', adminCtrl.listInvites);
router.post('/invites', adminCtrl.createInvite);
router.post('/invites/:id/resend', adminCtrl.resendInvite);
router.post('/invites/:id/revoke', adminCtrl.revokeInvite);

router.get('/users', adminCtrl.listUsers);
router.get('/requests', adminCtrl.listRequests);
router.get('/requests/:id/document', adminCtrl.getDocument);
router.post('/requests/:id/approve', adminCtrl.approveRequest);
router.post('/requests/:id/reject', adminCtrl.rejectRequest);

router.get('/entitlements/:userId', adminCtrl.getEntitlements);
router.put('/entitlements/:userId', adminCtrl.setEntitlements);

export default router;
