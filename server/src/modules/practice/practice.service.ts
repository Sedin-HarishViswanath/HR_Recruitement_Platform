import axios from 'axios';
import { env } from '../../config/env';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface ChatMessage {
  role: 'user' | 'model';
  parts: { text: string }[];
}

interface PracticeChatRequest {
  message: string;
  history: ChatMessage[];
  mode: 'behavioral' | 'technical' | 'system_design';
  language?: string;
  code?: string;
}

const SYSTEM_PROMPTS: Record<string, string> = {
  behavioral: `You are an expert behavioral interview coach at a top-tier tech company. Your name is RecruitAI Coach.

RULES:
- Ask ONE focused behavioral question at a time using the STAR method framework
- After the candidate answers, provide brief constructive feedback (2-3 sentences max)
- Then ask a follow-up or move to a new question
- Be encouraging but honest — highlight strengths and areas to improve
- Use varied question themes: leadership, conflict resolution, teamwork, failure, initiative
- Keep responses concise and conversational (under 150 words)
- Start with a friendly greeting and your first question if the conversation is new
- Format your responses with markdown for readability`,

  technical: `You are a senior software engineer conducting a technical coding interview at a FAANG company. Your name is RecruitAI Coach.

RULES:
- Present ONE algorithmic or data structure problem at a time
- Problems should range from medium to hard difficulty (LeetCode-style)
- When the candidate shares code, analyze it for:
  • Correctness
  • Time & space complexity
  • Edge cases they might have missed
  • Possible optimizations
- Give hints if the candidate is stuck — don't give the answer directly
- After they solve it, briefly discuss the optimal approach
- Keep responses concise (under 200 words)
- Start with a greeting and your first problem if the conversation is new
- Format code snippets using markdown code blocks`,

  system_design: `You are a principal engineer conducting a system design interview. Your name is RecruitAI Coach.

RULES:
- Present ONE system design problem at a time (e.g., "Design a URL shortener", "Design Twitter's feed")
- Guide the candidate through the design process step by step:
  1. Requirements clarification
  2. High-level architecture
  3. Data model
  4. API design
  5. Scaling considerations
- Ask probing questions about their design choices
- Point out trade-offs they should consider
- Keep responses concise (under 200 words)
- Start with a greeting and your first design challenge if the conversation is new
- Use markdown formatting for clarity`,
};

const MOCK_COACH_RESPONSES: Record<string, string[]> = {
  behavioral: [
    "That sounds like a great experience. How did you measure the success of your actions in that situation?",
    "Understood. When describing this, try to emphasize the 'Action' part of the STAR method. What specific challenges did you face?",
    "Thank you for sharing. Let's move to another common question: Tell me about a time you had to deal with a difficult team member. How did you resolve it?",
    "Great response. How would you handle a similar situation differently if it happened today?",
    "Excellent. Let's try one more behavioral question: Describe a time you had to make a decision without all the information you needed. What was the outcome?"
  ],
  technical: [
    "Interesting approach. What is the time and space complexity of your proposed solution?",
    "That makes sense. Can you think of any edge cases where this code might fail (e.g. empty inputs, large numbers)?",
    "Nice! Your code looks correct. How would you optimize this if we were processing a massive stream of real-time data?",
    "Let's move to the next coding challenge: Write a function to find the longest common prefix string amongst an array of strings. How would you start?",
    "Good start. Let's dry-run the logic with an example array: `['flower', 'flow', 'flight']`."
  ],
  system_design: [
    "That's a solid high-level architecture. Where do you foresee potential bottlenecks when scaling to millions of active users?",
    "How would you handle caching here to reduce load on the primary database?",
    "Using a load balancer is a great choice. How would you distribute traffic (e.g. round-robin, IP hash) and handle session stickiness?",
    "Let's address database choice: would you use a SQL or NoSQL database for this system, and why?",
    "Good considerations. How would you design the system for high availability and fault tolerance in case of a regional outage?"
  ]
};

export class PracticeService {
  async chat(request: PracticeChatRequest) {
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured. AI practice sessions require a Gemini API key.');
    }

    const systemPrompt = SYSTEM_PROMPTS[request.mode] || SYSTEM_PROMPTS.technical;

    // Build the conversation for Gemini
    const contents: ChatMessage[] = [];

    // Add system instruction as first user message + model acknowledgement
    contents.push({
      role: 'user',
      parts: [{ text: `[System Instructions — follow these for the entire conversation]\n\n${systemPrompt}` }],
    });
    contents.push({
      role: 'model',
      parts: [{ text: 'Understood. I will follow these instructions throughout our conversation.' }],
    });

    // Add conversation history
    if (request.history && request.history.length > 0) {
      contents.push(...request.history);
    }

    // Add the current user message, optionally with code context
    let userMessage = request.message;
    if (request.code && request.code.trim()) {
      userMessage += `\n\nHere is my current code (${request.language || 'unknown language'}):\n\`\`\`${request.language || ''}\n${request.code}\n\`\`\``;
    }

    contents.push({
      role: 'user',
      parts: [{ text: userMessage }],
    });

    const maxRetries = 3;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await axios.post(
          `https://generativelanguage.googleapis.com/v1beta/models/${env.GEMINI_MODEL}:generateContent`,
          {
            contents,
            generationConfig: {
              temperature: 0.7,
              topP: 0.9,
              topK: 40,
              maxOutputTokens: 1024,
            },
          },
          {
            params: { key: env.GEMINI_API_KEY },
            timeout: 30000,
          }
        );

        const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) {
          throw new Error('Empty response from AI model');
        }

        return {
          reply: text,
          role: 'model' as const,
        };
      } catch (error: any) {
        const status = error?.response?.status;
        if (status === 429 && attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 1000;
          console.warn(`[PracticeService] Gemini rate limit hit (429). Attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`);
          await sleep(delay);
          continue;
        }

        if (status === 429) {
          console.warn('[PracticeService] Gemini rate limit exhausted/key exhausted. Falling back to mock coach response.');
          
          const replies = MOCK_COACH_RESPONSES[request.mode] || MOCK_COACH_RESPONSES.technical;
          const index = Math.min(Math.floor((request.history?.length || 0) / 2), replies.length - 1);
          const replyText = replies[index] + 
            "\n\n*(Note: This is a simulated response because the system's shared Gemini API key is currently rate-limited or exhausted. To use unrestricted AI coaching, please set your own GEMINI_API_KEY in the root `.env` file and restart Docker).*";

          return {
            reply: replyText,
            role: 'model' as const,
          };
        }
        if (status === 400) {
          throw new Error('Request was invalid. Please try rephrasing your message.');
        }
        console.error('[PracticeService] Gemini error:', status || error?.message);
        throw new Error('Failed to get AI response. Please try again.');
      }
    }
  }
}

export const practiceService = new PracticeService();
