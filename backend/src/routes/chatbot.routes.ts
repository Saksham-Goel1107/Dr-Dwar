import { Router } from 'express';
import {
  createConversation,
  deleteConversation,
  getConversationHistory,
  handleChatMessage,
} from '../controllers/chatbot.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = Router();

// Create new conversation
router.post('/conversations', protectRoute, createConversation);

// Send chat message
router.post('/chat', protectRoute, handleChatMessage);

// Get conversation history for a user
router.get('/conversations/:userId', protectRoute, getConversationHistory);

// Delete a conversation
router.delete('/conversations/:conversationId', protectRoute, deleteConversation);

export default router;
