import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as meCtrl from '../controllers/meController.js';

const router = Router();
router.use(authRequired);

// Upload config (server stores uploads in backend/uploads)
const uploadsDir = path.join(process.cwd(), 'backend', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (_req, _file, cb) { cb(null, uploadsDir); },
  filename: function (_req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, unique + ext);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) return cb(new Error('Invalid file type'));
    cb(null, true);
  }
});

router.get('/balances', meCtrl.myBalances);
router.get('/requests', meCtrl.myRequests);
router.post('/requests', upload.single('document'), meCtrl.createRequest);
router.get('/requests/:id', meCtrl.requestDetail);
router.get('/requests/:id/document', meCtrl.getDocument);

export default router;
