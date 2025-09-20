import { clerkClient } from '@clerk/express';
import axios from 'axios';
import { Request, Response } from 'express';
import { BufferMemory } from 'langchain/memory';
import { AIMessage } from 'langchain/schema';
import { Client } from 'langsmith';
import { v4 as uuidv4 } from 'uuid';

// Initialize LangSmith client
const langsmithClient = new Client({
  apiUrl: process.env.LANGCHAIN_ENDPOINT,
  apiKey: process.env.LANGCHAIN_API_KEY,
});

// Store conversation memories using LangChain
const conversationMemories = new Map<string, BufferMemory>();

// Perplexity API configuration
const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

export const handleChatMessage = async (req: Request, res: Response) => {
  try {
    const { message, useWebSearch, conversationId } = req.body;
    const auth = req.auth();
    const userId = auth?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get or create conversation memory
    let memory = conversationMemories.get(conversationId);
    if (!memory) {
      memory = new BufferMemory({
        returnMessages: true,
        memoryKey: 'chat_history',
      });
      conversationMemories.set(conversationId, memory);
    }

    // Add user message to memory
    await memory.chatHistory.addUserMessage(message);

    let response: string;

    if (useWebSearch) {
      // Use Perplexity for web search with LangSmith tracing
      response = await getPerplexityResponse(memory, message, req);
    } else {
      // Return basic AI response without web search
      response = await getBasicAIResponse(memory, message, req);
    }

    // Add AI response to memory
    await memory.chatHistory.addMessage(new AIMessage(response));

    res.json({
      response: response,
      conversationId: conversationId,
      useWebSearch: useWebSearch,
    });
  } catch (error) {
    console.error('Chat error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({
      error: 'Failed to process chat message',
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
    });
  }
};

export const getConversationHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const userConversations = Array.from(conversationMemories.entries()).map(([id, memory]) => ({
      id,
      messages: memory.chatHistory.getMessages(),
      userId: userId,
      createdAt: new Date(), // LangChain doesn't store creation time, using current time
    }));

    res.json(userConversations);
  } catch (error) {
    console.error('Error fetching conversation history:', error);
    res.status(500).json({ error: 'Failed to fetch conversation history' });
  }
};

export const deleteConversation = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const deleted = conversationMemories.delete(conversationId);
    res.json({ success: deleted });
  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ error: 'Failed to delete conversation' });
  }
};

async function getPerplexityResponse(
  memory: BufferMemory,
  userMessage: string,
  req: Request,
): Promise<string> {
  const runId = uuidv4();

  try {
    // Start LangSmith run for Perplexity API call
    await langsmithClient.createRun({
      id: runId,
      name: 'perplexity_chat_completion',
      run_type: 'llm',
      inputs: {
        messages: userMessage,
        useWebSearch: true,
      },
      start_time: Date.now(),
    });

    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;

    if (!perplexityApiKey) {
      throw new Error('Perplexity API key not configured');
    }

    // Get user context from Clerk
    const auth = req.auth();
    const userId = auth?.userId;

    let userName = 'User';
    let userEmail = '';

    if (userId) {
      try {
        const user = await clerkClient.users.getUser(userId);
        userName = user.firstName || user.username || 'User';
        userEmail = user.emailAddresses?.[0]?.emailAddress || '';
      } catch (error) {
        console.warn('Failed to fetch user details from Clerk:', error);
        // Continue with default values
      }
    }

    // Get conversation history from LangChain memory
    const chatHistory = await memory.chatHistory.getMessages();
    const recentMessages = chatHistory.slice(-5); // Get last 5 messages

    // Prepare messages for Perplexity API
    const messages = [
      {
        role: 'system',
        content: `You are an expert AI health assistant with extensive medical knowledge and access to real-time web information through Perplexity AI.

INSTRUCTIONS FOR RESPONSES:
- Provide comprehensive, evidence-based health information
- Give practical advice and actionable recommendations
- Explain medical concepts clearly and accessibly
- Suggest lifestyle modifications and preventive measures
- Recommend over-the-counter solutions when appropriate
- Discuss treatment options and their pros/cons
- Explain symptoms, causes, and management strategies
- Provide nutritional and wellness guidance
- Answer medication-related questions informatively

IMPORTANT GUIDELINES:
- Only recommend consulting a doctor for serious symptoms, emergencies, or complex conditions
- For common ailments, provide detailed self-care advice
- Include preventive measures and when to seek professional help
- Be encouraging and supportive while being medically accurate
- Personalize responses using the user's name when available

The user is ${userName}${userEmail ? ` (${userEmail})` : ''}.
Focus on being helpful, informative, and empowering the user to make informed health decisions.`,
      },
      // Include recent conversation history for context
      ...recentMessages.map((msg: any) => ({
        role: msg._getType() === 'human' ? 'user' : 'assistant',
        content: msg.content,
      })),
    ];

    const startTime = Date.now();

    const response = await axios.post(
      PERPLEXITY_API_URL,
      {
        model: 'sonar',
        messages: messages,
        max_tokens: 1000,
        temperature: 0.4,
        stream: false, // We'll implement streaming later if needed
      },
      {
        headers: {
          Authorization: `Bearer ${perplexityApiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000, // 30 second timeout
      },
    );

    const endTime = Date.now();
    const aiResponse = response.data.choices?.[0]?.message?.content;

    if (!aiResponse) {
      throw new Error('No response from Perplexity API');
    }

    // Log to LangSmith with token usage and timing
    await langsmithClient.updateRun(runId, {
      outputs: {
        response: aiResponse,
        token_usage: response.data.usage || {},
        timing: {
          start_time: startTime,
          end_time: endTime,
          duration_ms: endTime - startTime,
        },
      },
      end_time: Date.now(),
    });

    return aiResponse;
  } catch (error: any) {
    // Log error to LangSmith
    await langsmithClient.updateRun(runId, {
      error: error.message,
      end_time: Date.now(),
    });

    console.error('Perplexity API error:', error.response?.data || error.message);

    if (error.response?.status === 401) {
      throw new Error('Invalid Perplexity API key');
    } else if (error.response?.status === 429) {
      throw new Error('Perplexity API rate limit exceeded');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - Perplexity API took too long to respond');
    }

    throw new Error('Failed to get response from AI service');
  }
}

async function getBasicAIResponse(
  memory: BufferMemory,
  userMessage: string,
  req: Request,
): Promise<string> {
  const runId = uuidv4();

  try {
    // Start LangSmith run for basic AI response
    await langsmithClient.createRun({
      id: runId,
      name: 'basic_ai_response',
      run_type: 'llm',
      inputs: {
        messages: userMessage,
        useWebSearch: false,
      },
      start_time: Date.now(),
    });

    // Get user context from Clerk
    const auth = req.auth();
    const userId = auth?.userId;

    let userName = 'User';
    let userEmail = '';

    if (userId) {
      try {
        const user = await clerkClient.users.getUser(userId);
        userName = user.firstName || user.username || 'User';
        userEmail = user.emailAddresses?.[0]?.emailAddress || '';
      } catch (error) {
        console.warn('Failed to fetch user details from Clerk:', error);
        // Continue with default values
      }
    }

    // Basic AI responses based on common health queries
    const message = userMessage.toLowerCase();

    let response = '';

    if (message.includes('hello') || message.includes('hi') || message.includes('hey')) {
      response = `Hello ${userName}! I'm your AI health assistant. I can help you with general health information, medication reminders, and wellness tips. How can I help you today?`;
    } else if (message.includes('medicine') || message.includes('medication')) {
      response = `${userName}, I can help you manage your medications and set up reminders. For medication questions, I can provide information about common medications, their uses, and general guidelines. What would you like to know about medications?`;
    } else if (message.includes('reminder') || message.includes('remind')) {
      response = `I can help you set up medication reminders and health check reminders. You can create reminders for specific times, frequencies, and types. This helps ensure you stay on track with your health routine. What kind of reminder would you like to set up?`;
    } else if (message.includes('health') || message.includes('wellness')) {
      response = `I'm here to support your health journey, ${userName}. I can provide guidance on nutrition, exercise, stress management, sleep hygiene, and preventive care. I can also help with general wellness questions and healthy lifestyle tips. What specific health topic interests you?`;
    } else if (message.includes('appointment') || message.includes('doctor')) {
      response = `For scheduling appointments and consultations, I recommend contacting your healthcare provider directly. I can help you prepare for appointments by suggesting what information to bring and questions to ask. Would you like tips for getting the most out of your doctor visits?`;
    } else if (message.includes('emergency') || message.includes('urgent')) {
      response = `If this is a medical emergency, please call emergency services immediately (911 in the US) or go to the nearest emergency room. For urgent but non-emergency situations, contact your healthcare provider or visit an urgent care center. I'm here for general health information but cannot provide emergency medical care.`;
    } else if (message.includes('pain') || message.includes('hurt')) {
      response = `${userName}, pain can have many causes. For mild pain, rest, ice/heat, over-the-counter pain relievers like acetaminophen or ibuprofen, and gentle stretching often help. However, if pain is severe, persistent, or accompanied by other symptoms, please consult a healthcare provider for proper evaluation.`;
    } else if (
      message.includes('diet') ||
      message.includes('nutrition') ||
      message.includes('food')
    ) {
      response = `Nutrition plays a crucial role in health! I can provide guidance on balanced diets, healthy eating patterns, nutritional needs for different life stages, and tips for managing various dietary requirements. A healthy diet typically includes plenty of fruits, vegetables, whole grains, lean proteins, and healthy fats. What specific nutrition question do you have?`;
    } else if (
      message.includes('exercise') ||
      message.includes('workout') ||
      message.includes('fitness')
    ) {
      response = `Regular physical activity is essential for good health! I can help with exercise recommendations, workout plans, tips for staying motivated, and guidance on different types of exercise for various fitness levels and health conditions. The key is finding activities you enjoy and can maintain consistently. What are your fitness goals?`;
    } else if (message.includes('sleep') || message.includes('insomnia')) {
      response = `Quality sleep is fundamental to health and well-being. Good sleep hygiene includes maintaining a consistent sleep schedule, creating a relaxing bedtime routine, keeping your bedroom cool and dark, avoiding screens before bed, and limiting caffeine. If sleep problems persist, establishing healthy sleep habits can make a big difference.`;
    } else if (
      message.includes('stress') ||
      message.includes('anxiety') ||
      message.includes('mental')
    ) {
      response = `Mental health is just as important as physical health. Stress management techniques include deep breathing exercises, meditation, regular physical activity, maintaining social connections, and practicing mindfulness. For persistent mental health concerns, professional support can be very beneficial.`;
    } else {
      response = `I'm your health assistant, ${userName}. I can help with a wide range of health topics including nutrition, exercise, stress management, medication information, wellness tips, and general health guidance. For specific medical conditions or personalized advice, it's always best to consult with healthcare professionals. What health topic would you like to explore?`;
    }

    const endTime = Date.now();

    // Log to LangSmith
    await langsmithClient.updateRun(runId, {
      outputs: {
        response: response,
        timing: {
          start_time: Date.now(),
          end_time: endTime,
          duration_ms: endTime - Date.now(),
        },
      },
      end_time: Date.now(),
    });

    return response;
  } catch (error: any) {
    // Log error to LangSmith
    await langsmithClient.updateRun(runId, {
      error: error.message,
      end_time: Date.now(),
    });

    console.error('Basic AI response error:', error);
    throw new Error('Failed to generate AI response');
  }
}

export const createConversation = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const conversationId = uuidv4();

    const memory = new BufferMemory({
      returnMessages: true,
      memoryKey: 'chat_history',
    });

    conversationMemories.set(conversationId, memory);

    res.json({
      conversationId,
      message: 'Conversation created successfully',
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};
