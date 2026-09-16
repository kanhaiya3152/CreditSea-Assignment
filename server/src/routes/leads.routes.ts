import { Router } from 'express';
import { listLeads } from '../controllers/leads.controller';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.get('/', authMiddleware, requireRole('SALES'), listLeads);

export default router;
