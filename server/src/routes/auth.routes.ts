import { Router } from 'express';
import { login, me, signup } from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
// No /logout: the token is stateless, so signing out is the client discarding it.
router.get('/me', authMiddleware, me);

export default router;
