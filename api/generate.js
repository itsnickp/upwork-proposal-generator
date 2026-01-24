// api/generate.js - Using Groq (FREE & VERY FAST)
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

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

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured. Add GROQ_API_KEY to Vercel environment variables.' 
      });
    }

    const prompt = `Generate a professional Upwork proposal for this job posting.

Job Description:
${jobDescription}

My Skills: ${skills || 'Not specified'}
My Experience: ${experience || 'Not specified'}

Write a compelling, personalized proposal that:
1. Demonstrates understanding of the job requirements
2. Highlights relevant skills and experience
3. Shows enthusiasm for the project
4. Includes a clear call to action
5. Is concise and professional (150-200 words)`;

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content: 'You are a professional proposal writer for freelance platforms.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `API request failed: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return res.status(500).json({ 
        error: 'Invalid response from API',
        details: data
      });
    }

    const proposal = data.choices[0].message.content.trim();

    return res.status(200).json({ proposal });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate proposal',
      message: error.message
    });
  }
}
