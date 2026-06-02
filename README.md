# ECHO

**ECHO** is a personal cashflow and expense tracking web app built to help users monitor their allowance, expenses, debts, and spending habits in a simple and visual way.

The project is designed for students or individuals who want a clearer view of where their money goes. Instead of only logging transactions, ECHO gives users quick insights such as budget usage, remaining balance, spending distribution, debt status, and a predicted “broke date” based on recent spending behavior.

## Features

* User authentication with Supabase
* Allowance and budget cycle setup
* Expense, allowance, shortage, and debt tracking
* Debt status management
* Receipt scanning using OCR
* Financial analytics dashboard
* Spending category breakdown
* Predicted broke date based on recent expenses
* Coach/Roast tone mode for personalized feedback
* Light and dark mode
* Responsive, mobile-friendly interface

## Tech Stack

* **Next.js**
* **React**
* **TypeScript**
* **Tailwind CSS**
* **Supabase**
* **Framer Motion**
* **Recharts**
* **Tesseract.js**
* **Vercel**

## Getting Started

Clone the repository:

```bash
git clone https://github.com/amseph/echo.git
cd echo
```

Install dependencies:

```bash
npm install
```

Create a `.env.local` file and add your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Run the development server:

```bash
npm run dev
```

Open the app in your browser:

```bash
http://localhost:3000
```

## Live Demo

ECHO is already deployed and hosted on **Vercel**.

Live Site: `https://echo-omega-seven.vercel.app`


## Project Purpose

ECHO was built as a personal project to explore how finance tracking can feel more familiar, visual, and engaging for everyday users. The goal is to make budgeting less intimidating by combining clean UI, useful analytics, and personality-driven feedback into one simple dashboard.

## Developer

Developed by **Ivan Jaurigue**.

