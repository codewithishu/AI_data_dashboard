const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

router.post('/insights', async (req, res) => {
  try {
    const { columns, stats, totalRows, sampleData } = req.body;

    if (!columns || !stats) {
      return res.status(400).json({ message: 'Data is required!' });
    }

    const prompt = `You are a data analyst. Analyze this dataset and provide insights in plain English.

Dataset Summary:
- Total Rows: ${totalRows}
- Columns: ${columns.join(', ')}
- Statistics: ${JSON.stringify(stats, null, 2)}
- Sample Data (first 5 rows): ${JSON.stringify(sampleData, null, 2)}

Please provide:
1. A brief summary of what this dataset is about
2. Top 3 key insights from the data
3. Any interesting trends or patterns you notice
4. One recommendation based on the data

Keep it simple, clear and easy to understand for a non-technical person.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }]
    });

    const insights = completion.choices[0].message.content;
    res.json({ insights });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'AI service error' });
  }
});

module.exports = router;