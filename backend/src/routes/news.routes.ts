import { Router } from 'express';
import { createNews, getAllNews, getNewsById } from '../controllers/news.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

router.get('/', protectRoute, getAllNews);
router.get('/:id', protectRoute, getNewsById);
router.post('/', protectRoute, createNews);

export default router;
