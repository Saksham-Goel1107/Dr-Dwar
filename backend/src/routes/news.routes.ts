import { Router } from 'express';
import { createNews, getAllNews, getNewsById } from '../controllers/news.controller';
import { protectRoute } from '../middleware/auth.middleware';

const router = Router();

router.get('/', protectRoute, getAllNews);
router.get('/:id', protectRoute, getNewsById);
router.post('/', protectRoute, createNews);

export default router;
