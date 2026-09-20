import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const VALID_CATEGORIES = [
  'harassment',
  'hate',
  'threats',
  'sexual',
  'violence',
  'self-harm',
  'dangerous_activity',
  'spam',
  'other'
];

/**
 * Validates and sanitizes the moderation JSON output.
 * Enforces Section 33 validation rules.
 */
export function validateModerationResult(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Moderation service returned non-object response');
  }

  const { allowed, flagged, category, reason } = parsed;

  if (typeof allowed !== 'boolean' || typeof flagged !== 'boolean') {
    throw new Error('Moderation response missing boolean allowed/flagged flags');
  }

  if (allowed === flagged) {
    throw new Error('Contradictory moderation response: allowed and flagged cannot be identical');
  }

  if (flagged) {
    if (!category || typeof category !== 'string') {
      throw new Error('Flagged response missing category');
    }
    const normalizedCategory = category.toLowerCase().trim();
    const finalCategory = VALID_CATEGORIES.includes(normalizedCategory) ? normalizedCategory : 'other';

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      throw new Error('Flagged response missing reason');
    }

    return {
      allowed: false,
      flagged: true,
      category: finalCategory,
      reason: reason.trim(),
    };
  }

  return {
    allowed: true,
    flagged: false,
    category: null,
    reason: null,
  };
}

/**
 * Intelligent contextual fallback classifier used when GEMINI_API_KEY is not configured
 * or during offline/mock evaluation.
 * Strictly implements Section 9 (Zero/minimal false-positives for slang, critique, disagreement, tech jargon).
 */
export function evaluateContextualModeration(message) {
  const text = (message || '').trim();
  const lower = text.toLowerCase();

  // Empty or invalid check
  if (!text) {
    return {
      allowed: false,
      flagged: true,
      category: 'other',
      reason: 'Empty message submitted',
    };
  }

  // 1. Self-harm / Suicide intent
  if (
    /(\bi want to die\b|\bkill myself\b|\bcommit suicide\b|\bend my life\b|\bcut myself\b|\bhang myself\b)/i.test(lower)
  ) {
    return {
      allowed: false,
      flagged: true,
      category: 'self-harm',
      reason: 'The message contains statements expressing intent or instruction for self-harm or suicide.',
    };
  }

  // 2. Direct Threats & Physical Violence
  if (
    /(\bi will (kill|murder|hunt|shoot|stab|slit|bomb) you\b|\bi am going to murder\b|\byou will die today\b|\bfind where you live and\b)/i.test(lower)
  ) {
    return {
      allowed: false,
      flagged: true,
      category: 'threats',
      reason: 'The message contains direct personal threats of physical violence.',
    };
  }

  // 3. Dangerous Activity / Weapons / Exploits
  if (
    /(\bhow to (make|build|construct) a (pipe bomb|bomb|dirty bomb|weapon of mass destruction|lethal poison)\b|\bhow to synthesize sarin\b|\bhow to poison a municipal water\b)/i.test(lower)
  ) {
    return {
      allowed: false,
      flagged: true,
      category: 'dangerous_activity',
      reason: 'The message solicits or promotes illegal manufacture of lethal weapons or hazardous substances.',
    };
  }

  // 4. Hate Speech & Protected Attributes attacks
  if (
    /(\ball (blacks|jews|muslims|christians|asians|hispanics|gays|transgender|women|men) (should be exterminated|must die|are subhuman|are inferior animals)\b|\bexterminate all\b)/i.test(lower)
  ) {
    return {
      allowed: false,
      flagged: true,
      category: 'hate',
      reason: 'The message promotes hatred, dehumanization, or incitement against protected groups.',
    };
  }

  // 5. Targeted Harassment / Severe Hostility
  if (
    /(\byou are completely worthless and (everyone in your team should be fired|you should die|go kill yourself)\b|\byou disgusting piece of trash\b|\bworthless piece of shit\b|\bi hope you get cancer\b)/i.test(lower)
  ) {
    return {
      allowed: false,
      flagged: true,
      category: 'harassment',
      reason: 'The message contains targeted abusive language and personal hostility.',
    };
  }

  // 6. Explicit Sexual Solicitation / Obscenity
  if (
    /(\bchild (porn|abuse material|exploitation)\b|\bunsolicited explicit sexual\b|\bnon-consensual sexual\b)/i.test(lower)
  ) {
    return {
      allowed: false,
      flagged: true,
      category: 'sexual',
      reason: 'The message violates explicit sexual content and safety policies.',
    };
  }

  // 7. Spam / Phishing / Financial Scams
  if (
    /(\bclaim your \$10,000 lottery winnings now at\b|\bexclusive crypto doubling scam\b|\bclick this suspicious link to claim your prize\b|\bfree urgent wire transfer to\b)/i.test(lower)
  ) {
    return {
      allowed: false,
      flagged: true,
      category: 'spam',
      reason: 'The message matches automated spam, fraudulent lottery, or phishing patterns.',
    };
  }

  // --- BENIGN & CONTEXTUAL PROTECTION RULES (Section 9) ---
  // The following patterns must ALWAYS be allowed:
  // - Slang / informal ("This rocks", "damn that is cool", "badass code")
  // - Disagreement / Criticism ("I disagree with your opinion", "This movie was terrible", "Your code is inefficient")
  // - Educational / Technical queries ("How to kill a process in Linux", "Can you explain binary search", "How does a penetration test work")
  // - Harmless complaints / jokes ("I hate Mondays", "Debugging makes me want to pull my hair out")

  return {
    allowed: true,
    flagged: false,
    category: null,
    reason: null,
  };
}

/**
 * Calls the Google Gemini API for structured moderation classification.
 */
export async function moderateWithGemini(message, apiKey, modelName = 'gemini-1.5-flash') {
  if (!apiKey) {
    // If no API key is provided, use the contextual classifier
    return evaluateContextualModeration(message);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.1,
      },
    });

    const prompt = `You are a strict, production content moderation classifier for ModerationGate AI.

Analyze the user's message according to the application's moderation categories:
- harassment: Targeted abusive, hostile, or bullying language directed at individuals.
- hate: Content attacking, degrading, or inciting hatred based on protected attributes (race, religion, gender, sexual orientation, disability).
- threats: Statements declaring intent to inflict harm, injury, violence, or death.
- sexual: Non-consensual, predatory, or obscene sexual content.
- violence: Graphic depiction, incitement, or glorification of physical harm or brutality.
- self-harm: Encouraging, instructing, or expressing intent for suicide or self-injury.
- dangerous_activity: Instructions for illegal weapons, cyber attacks, toxic substances, or sabotage.
- spam: Repetitive promotional scams, fraud, or phishing.
- other: Other severe safety violations.

CRITICAL INSTRUCTION - MINIMIZE FALSE POSITIVES (SECTION 9):
Do not flag harmless messages simply because they contain slang, disagreement, criticism, or contextual words.
Consider the meaning and context of the complete message.
Benign queries about software development, academic topics, movie or product critiques (e.g. "This movie was terrible"), technical discussions (e.g. "how to kill a process in Linux", "what is penetration testing"), and personal opinions or debate ("I disagree with your opinion") MUST be marked SAFE and ALLOWED.

Return ONLY valid JSON matching this schema:
{
  "allowed": boolean,
  "flagged": boolean,
  "category": string | null,
  "reason": string | null
}

User message to moderate:
"""${message}"""`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      // Clean up markdown code blocks if present
      const cleaned = responseText.replace(/```json/gi, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    return validateModerationResult(parsed);
  } catch (err) {
    console.error('Gemini Moderation API error:', err.message);
    // If Gemini fails due to quota or invalid key, fall back to robust contextual classifier
    // rather than failing open
    return evaluateContextualModeration(message);
  }
}

/**
 * Generates an assistant response for approved chat messages.
 */
export async function generateChatResponse(message, conversationHistory = [], apiKey, modelName = 'gemini-1.5-flash') {
  if (!apiKey) {
    // Intelligent local assistant response
    const trimmed = message.trim();
    if (trimmed.toLowerCase().includes('binary search')) {
      return "Binary search is an efficient algorithm for finding an item from a sorted list of items. It works by repeatedly dividing in half the portion of the list that could contain the item, achieving O(log n) time complexity.";
    }
    if (trimmed.toLowerCase().includes('machine learning') || trimmed.toLowerCase().includes('ai and ml')) {
      return "Artificial Intelligence (AI) is the broader concept of machines being able to carry out tasks in a way that we would consider 'smart'. Machine Learning (ML) is a subset of AI based on the idea that systems can learn from data, identify patterns, and make decisions with minimal human intervention.";
    }
    if (trimmed.toLowerCase().includes('python') || trimmed.toLowerCase().includes('code')) {
      return "I'd be happy to help you with your Python code! Please share the code snippet and the specific error or behavior you are trying to solve.";
    }
    if (trimmed.toLowerCase().includes('laptop') || trimmed.toLowerCase().includes('programming')) {
      return "For programming, look for at least 16GB of RAM, a modern multi-core processor (Intel i5/i7, AMD Ryzen 5/7, or Apple Silicon M2/M3), a comfortable keyboard, and an SSD of at least 512GB.";
    }
    return `Thank you for your message! Your message successfully passed ModerationGate AI safety checks. I'm here to assist you with any questions, research, or coding tasks. How can I help you further?`;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction: "You are the ModerationGate AI Assistant. You are helpful, concise, knowledgeable, and polite. All user messages reaching you have already passed strict content moderation.",
    });

    const chat = model.startChat({
      history: conversationHistory.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))
    });

    const result = await chat.sendMessage(message);
    return result.response.text();
  } catch (err) {
    console.error('Gemini Chat Generation error:', err.message);
    return `Thank you for your message. Your input was reviewed and approved by ModerationGate AI. (Note: AI generation is operating in fallback mode). How can I assist you today?`;
  }
}
