// api/generate.js
export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { jobDescription, skills, experience } = req.body;

    if (!jobDescription) {
      return res.status(400).json({ error: 'Job description is required' });
    }

    // Check if API key exists
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY not found in environment variables');
      return res.status(500).json({ 
        error: 'API key not configured. Please add ANTHROPIC_API_KEY to your Vercel environment variables.' 
      });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Generate a professional Upwork proposal for the following job posting.

Job Description:
${jobDescription}

My Skills: ${skills || 'Not specified'}
My Experience: ${experience || 'Not specified'}

Please write a compelling, personalized proposal that:
1. Demonstrates understanding of the job requirements
2. Highlights relevant skills and experience
3. Shows enthusiasm for the project
4. Includes a clear call to action
5. Is concise and professional (around 150-200 words)

Format the proposal ready to copy and paste into Upwork.`
        }]
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Anthropic API error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: `API request failed: ${response.statusText}`,
        details: errorData 
      });
    }

    const data = await response.json();
    
    // Extract the text from Claude's response
    const proposal = data.content
      .filter(block => block.type === 'text')
      .map(block => block.text)
      .join('\n');

    return res.status(200).json({ proposal });

  } catch (error) {
    console.error('Error generating proposal:', error);
    return res.status(500).json({ 
      error: 'Failed to generate proposal',
      message: error.message 
    });
  }
}
