// api/generate.js - CORRECTED for Google Gemini API
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

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured. Please add GOOGLE_API_KEY to your Vercel environment variables.' 
      });
    }

    const prompt = `Generate a professional Upwork proposal for the following job posting.

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

Format the proposal ready to copy and paste into Upwork.`;

    // Correct Gemini API format with proper header
    const response = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': process.env.GOOGLE_API_KEY
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `API request failed: ${response.statusText}`,
        details: errorText
      });
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      return res.status(500).json({ 
        error: 'Invalid response from API',
        details: data
      });
    }

    const proposal = data.candidates[0].content.parts
      .map(part => part.text)
      .join('\n');

    return res.status(200).json({ proposal });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ 
      error: 'Failed to generate proposal',
      message: error.message
    });
  }
}
