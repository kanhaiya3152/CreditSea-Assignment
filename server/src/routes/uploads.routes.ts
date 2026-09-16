import { Router } from 'express';
import { uploadSalarySlipHandler } from '../controllers/upload.controller';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';
import { uploadSalarySlip } from '../middleware/upload';

const router = Router();

router.post('/salary-slip', authMiddleware, requireRole('BORROWER'), uploadSalarySlip, uploadSalarySlipHandler);

export default router;
