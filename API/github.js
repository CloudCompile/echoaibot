export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method not allowed');
  }

  const payload = req.body;

  if (payload.action !== 'opened' || !payload.issue) {
    return res.status(200).send('Not an issue event');
  }

  const issueBody = payload.issue.body;
  const issueTitle = payload.issue.title;
  const repoFullName = payload.repository.full_name;
  const issueNumber = payload.issue.number;

  const aiResponse = await fetch('https://text.pollinations.ai/openai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        { role: "system", content: "You are an AI responding to GitHub issues." },
        { role: "user", content: `Issue Title: ${issueTitle}\n\n${issueBody}\n\nRespond:` }
      ]
    })
  });

  const aiData = await aiResponse.json();
  const aiText = aiData.choices?.[0]?.message?.content || "Couldn't generate a response.";

  // Post comment back
  await fetch(`https://api.github.com/repos/${repoFullName}/issues/${issueNumber}/comments`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github+json'
    },
    body: JSON.stringify({ body: aiText })
  });

  // (Optional) Save a log somewhere for dashboard (like Vercel KV)
  
  res.status(200).send('Commented successfully!');
}
