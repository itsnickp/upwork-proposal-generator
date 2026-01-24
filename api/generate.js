// api/generate.js
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

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({ 
        error: 'API key not configured. Add GOOGLE_API_KEY to Vercel environment variables.' 
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
5. Is concise and professional (150-200 words)

Format ready to copy and paste into Upwork.`;

    // Use gemini-pro (the stable model) instead of gemini-2.5-flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GOOGLE_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
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
    
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
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
```

## Key Changes Made

1. **Fixed API endpoint**: Changed from `gemini-2.5-flash` to `gemini-pro` (the actual available model)
2. **Fixed authentication**: Moved API key to query parameter (the documented method for Gemini)
3. **Removed redundant header**: `x-goog-api-key` header is not needed when using query param
4. **Improved error handling**: Used optional chaining for safer access

## Deployment Steps

1. **Ensure correct structure**:
```
   your-project/
   ├── api/
   │   └── generate.js
   └── public/
       └── index.html
