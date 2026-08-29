# GetCited

**GetCited** is an AI Search Optimization (AEO/GEO) platform that helps websites improve their visibility across AI-powered search engines and conversational assistants. As users increasingly rely on platforms such as ChatGPT, Gemini, Claude, Perplexity, and Microsoft Copilot to discover information, traditional SEO alone is no longer sufficient.

GetCited analyzes a website's technical structure, semantic content, metadata, and authority signals to evaluate how effectively AI models can understand and reference it. The platform then provides actionable recommendations that improve AI visibility, citation readiness, and overall discoverability.

---

## Overview

The way people search for information is evolving. AI assistants now provide direct, synthesized answers instead of lists of links, fundamentally changing how websites receive traffic.

While conventional SEO tools focus on search engine rankings, GetCited is designed for the emerging AI search ecosystem. It enables businesses, creators, and developers to understand how AI systems interpret their websites and what improvements are required to increase the likelihood of being cited in AI-generated responses.

---

## Key Features

- **AI Visibility Analysis** – Evaluate how well AI systems can interpret your website.
- **Citation Readiness Score** – Measure the likelihood of your content being referenced by AI assistants.
- **Technical Website Audit** – Analyze metadata, schema markup, semantic HTML, crawlability, and structured content.
- **Optimization Recommendations** – Receive prioritized, actionable improvements to enhance AI discoverability.
- **Performance Dashboard** – View comprehensive reports covering AI visibility, technical health, and optimization progress.

---

## How It Works

1. Submit a website URL.
2. The platform crawls and analyzes the website.
3. Technical SEO, structured data, metadata, and content quality are evaluated.
4. AI Visibility and Citation Readiness scores are generated.
5. A detailed optimization report with actionable recommendations is provided.

---

## Technology Stack

### Frontend
- Next.js (App Router) + React
- TypeScript
- Tailwind CSS

### Backend
- Supabase (PostgreSQL, Auth, Edge Functions)
- Python saliency/ad-hotspot service (Flask) — `backend/getcited/`:
  - `saliency_model.py` — visual saliency scoring using CLIP + DeepGaze
  - `sitemap_crawler.py` — crawls a site's sitemap for page discovery
  - `ad_hotspots.py`, `ab_store.py`, `audit_store.py` — hotspot detection, A/B and audit result storage

### AI & Analysis
- Large Language Models
- CLIP (OpenAI) + DeepGaze for visual saliency
- Structured Data Analysis
- Semantic Content Processing

### Deployment
- Vercel (frontend)
- Supabase (data/auth)

---

## Use Cases

GetCited is designed for:

- Businesses improving AI search visibility
- SaaS companies
- Digital marketing agencies
- E-commerce platforms
- Publishers
- Developers
- Content creators

---

## Project Structure

```
src/
├── app/          # Next.js App Router routes
├── components/
├── lib/
└── types/
backend/getcited/ # Python Flask saliency/ad-hotspot service
```

---

## Getting Started

### Frontend

```bash
git clone https://github.com/harsh4k/Getcited.git
cd Getcited
npm install
npm run dev       # dev server
npm run build     # production build
```

### Backend (saliency service)

```bash
cd backend/getcited
pip install -r requirements.txt
python app.py
```

---

## Team

**TheTokenizers**

Built for **NamasteDev Hackathon 2026**.
