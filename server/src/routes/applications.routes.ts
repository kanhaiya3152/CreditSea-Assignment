import { Router } from 'express';
import {
  breCheck,
  disburseApplication,
  getApplicationPayments,
  getMyApplications,
  listApplications,
  recordPayment,
  rejectApplication,
  sanctionApplication,
  submitApplication,
} from '../controllers/applications.controller';
import { authMiddleware } from '../middleware/auth';
import { requireRole } from '../middleware/rbac';

const router = Router();

router.post('/bre-check', authMiddleware, requireRole('BORROWER'), breCheck);
router.post('/', authMiddleware, requireRole('BORROWER'), submitApplication);
router.get('/me', authMiddleware, requireRole('BORROWER'), getMyApplications);

router.get('/', authMiddleware, requireRole('SANCTION', 'DISBURSEMENT', 'COLLECTION'), listApplications);

router.patch('/:id/sanction', authMiddleware, requireRole('SANCTION'), sanctionApplication);
router.patch('/:id/reject', authMiddleware, requireRole('SANCTION'), rejectApplication);
router.patch('/:id/disburse', authMiddleware, requireRole('DISBURSEMENT'), disburseApplication);

router.post('/:id/payments', authMiddleware, requireRole('COLLECTION'), recordPayment);
// Ownership (owning borrower) is checked inside the controller since it's data-dependent, not role-based.
router.get('/:id/payments', authMiddleware, getApplicationPayments);

export default router;
