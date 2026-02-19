// Vercel Serverless Function
// File: api/search.js

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, subject, query, gradeLevel, resourceType } = req.body;

    // Validation
    if (!apiKey || !subject || !query || !gradeLevel || !resourceType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Build prompt for Claude
    const prompt = `Search the web for high-quality educational resources about "${query}" in the subject of ${subject}, suitable for grade level ${gradeLevel}.

Focus on finding:
${resourceType === 'all' ? '- Any type of educational resource (worksheets, articles, videos, activities, lesson plans)' : '- ' + resourceType.charAt(0).toUpperCase() + resourceType.slice(1)}

Requirements:
- FREE resources only (no paywalls)
- Appropriate for ${gradeLevel} grade level
- From reputable educational sites
- Diverse sources (max 2 per site)
- High quality, teacher-ready

Find 5-8 resources. Use web_search tool.

CRITICAL: Return ONLY valid JSON in this EXACT format with NO explanation, NO markdown, NO text before or after:
{"resources":[{"title":"Resource title","source":"Website name","url":"https://...","description":"Brief description","type":"worksheet"}]}`;

    // Call Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        system: 'You are a JSON API. You ONLY return valid JSON. Never include explanations, markdown formatting, or any text outside the JSON object. Your entire response must be parseable JSON.',
        messages: [{
          role: 'user',
          content: prompt
        }],
        tools: [{
          type: "web_search_20250305",
          name: "web_search"
        }]
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return res.status(response.status).json({ 
        error: error.error?.message || 'API request failed' 
      });
    }

    const data = await response.json();

    // Extract text from response
    let resultText = '';
    for (const block of data.content) {
      if (block.type === 'text') {
        resultText += block.text;
      }
    }

    // Try to parse JSON from response - handle multiple formats
    let results = null;
    
    // Method 1: Look for JSON in code blocks
    const codeBlockMatch = resultText.match(/```json\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      try {
        results = JSON.parse(codeBlockMatch[1]);
      } catch (e) {
        // Continue to next method
      }
    }
    
    // Method 2: Look for raw JSON object
    if (!results) {
      const jsonMatch = resultText.match(/\{[\s\S]*"resources"[\s\S]*?\[\s*\{[\s\S]*?\]\s*\}/);
      if (jsonMatch) {
        try {
          results = JSON.parse(jsonMatch[0]);
        } catch (e) {
          // Continue to next method
        }
      }
    }
    
    // Method 3: Try to extract just the resources array
    if (!results) {
      const arrayMatch = resultText.match(/"resources"\s*:\s*(\[[\s\S]*?\])\s*\}/);
      if (arrayMatch) {
        try {
          const resourcesArray = JSON.parse(arrayMatch[1]);
          results = { resources: resourcesArray };
        } catch (e) {
          // Failed
        }
      }
    }
    
    if (!results || !results.resources) {
      return res.status(500).json({ 
        error: 'Could not parse results from Claude response',
        rawResponse: resultText.substring(0, 500) // Send first 500 chars for debugging
      });
    }

    return res.status(200).json(results);

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
