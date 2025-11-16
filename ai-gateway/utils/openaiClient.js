// utils/openaiClient.js - OpenAI API wrapper
// Handles API calls with error handling and cost calculation

const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// GPT-4o-mini pricing (as of Nov 2024)
const PRICING = {
  'gpt-4o-mini': {
    input: 0.150 / 1_000_000,   // $0.150 per 1M input tokens
    output: 0.600 / 1_000_000   // $0.600 per 1M output tokens
  }
};

// Calculate cost based on token usage
function calculateCost(usage, model = 'gpt-4o-mini') {
  const pricing = PRICING[model] || PRICING['gpt-4o-mini'];
  
  const inputCost = usage.prompt_tokens * pricing.input;
  const outputCost = usage.completion_tokens * pricing.output;
  
  return inputCost + outputCost;
}

// Make a completion request
async function completion(messages, options = {}) {
  try {
    const response = await openai.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.max_tokens || 1000,
      response_format: options.response_format || { type: 'text' }
    });

    const usage = response.usage;
    const cost = calculateCost(usage, options.model || 'gpt-4o-mini');

    return {
      content: response.choices[0].message.content,
      usage: {
        prompt_tokens: usage.prompt_tokens,
        completion_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens
      },
      cost: cost,
      model: response.model
    };

  } catch (error) {
    console.error('OpenAI API Error:', error.message);
    
    if (error.response) {
      throw new Error(`OpenAI API error: ${error.response.status} - ${error.response.data?.error?.message || 'Unknown error'}`);
    }
    
    throw new Error(`OpenAI API error: ${error.message}`);
  }
}

// Make a JSON-formatted completion request
async function jsonCompletion(messages, options = {}) {
  const response = await completion(messages, {
    ...options,
    response_format: { type: 'json_object' }
  });

  try {
    const parsed = JSON.parse(response.content);
    return {
      ...response,
      data: parsed
    };
  } catch (error) {
    console.error('Failed to parse JSON response:', response.content);
    throw new Error('OpenAI returned invalid JSON');
  }
}

module.exports = {
  completion,
  jsonCompletion,
  calculateCost
};