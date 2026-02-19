// Vercel Serverless Function - SIMPLIFIED
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

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { apiKey, subject, query, gradeLevel, resourceType } = req.body;

    if (!apiKey || !subject || !query || !gradeLevel || !resourceType) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Simple, clear prompt
    const prompt = `Find 5-8 FREE educational resources about "${query}" for ${subject}, grade ${gradeLevel}.

Requirements:
- FREE only (no paywalls)
- Grade-appropriate for ${gradeLevel}
- Diverse sources (max 2 per site)
${resourceType !== 'all' ? `- Focus on: ${resourceType}` : ''}

For EACH resource, provide:
1. Title
2. Website name
3. Direct URL
4. One sentence description

Use web_search to find current resources.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
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

    // Extract ALL text from response
    let resultText = '';
    for (const block of data.content) {
      if (block.type === 'text') {
        resultText += block.text + '\n';
      }
    }

    // Return the raw text
    return res.status(200).json({ 
      text: resultText,
      success: true
    });

  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error' 
    });
  }
}
