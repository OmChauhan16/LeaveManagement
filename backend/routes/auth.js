import { Router } from 'express';
import { login, registerViaInvite } from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.post('/register-via-invite', registerViaInvite);

export default router;
