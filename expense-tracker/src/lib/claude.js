import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are a precise financial data extraction assistant. Parse bank statement text and extract ALL transactions.

Return ONLY valid JSON (no markdown, no explanation, no code blocks):
{
  "transactions": [
    {
      "date": "2024-01-15",
      "description": "STARBUCKS COFFEE #12345",
      "amount": -4.75,
      "category": "Food & Drink",
      "type": "debit"
    }
  ],
  "period": {
    "start": "2024-01-01",
    "end": "2024-01-31"
  },
  "currency": "CAD"
}

Category options (pick the most appropriate one):
- Food & Drink (restaurants, cafes, groceries, food delivery)
- Transport (gas, transit, parking, rideshare, car payments)
- Shopping (retail, online shopping, clothing, electronics)
- Entertainment (streaming, movies, games, events, hobbies)
- Bills & Utilities (rent, mortgage, electricity, internet, phone, insurance)
- Health (medical, pharmacy, gym, dental, wellness)
- Travel (hotels, flights, vacation, tourism)
- Income (salary, payroll, transfers in, refunds, deposits)
- Transfer (credit card payments, internal transfers between own accounts)
- Other (anything that doesn't fit above)

Rules:
- Negative amounts = money going out (expenses, debits)
- Positive amounts = money coming in (income, credits)
- Date format: YYYY-MM-DD
- Keep descriptions clean but informative
- If a transaction is ambiguous, use "Other"
- Include ALL transactions, even small ones`

export async function parseStatement(text, apiKey) {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 8096,
    system: SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Extract all transactions from this bank statement:\n\n${text}`
    }]
  })

  const content = response.content[0].text.trim()
  // Strip markdown code blocks if present
  const jsonStr = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
  return JSON.parse(jsonStr)
}
