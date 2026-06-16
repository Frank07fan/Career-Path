# ExpenseAI — Local Expense Tracker

A fully local, privacy-first expense tracking app that uses Claude AI to parse bank statements.

## Features

- Upload bank statements as PDF, CSV, or TXT
- Claude AI extracts all transactions automatically
- Dashboard with spending charts (by category, monthly overview)
- Filter and search transactions
- All data stored locally in the browser (localStorage)
- Dark vivid theme

## Setup

```bash
cd expense-tracker
npm install
npm run dev
```

Then open http://localhost:5173, go to **Settings**, and paste your Anthropic API key.

## Privacy

- Your statement text is sent to the Claude API for extraction only
- Parsed transactions are saved to your browser's localStorage
- No data is stored on any server
