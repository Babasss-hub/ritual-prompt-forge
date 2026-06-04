# ⚡ Ritual Prompt Forge

AI Prompt Generator on Ritual Chain — Generate, test, and mint AI prompts as NFTs using on-chain LLM inference.

![Ritual Prompt Forge](https://img.shields.io/badge/Chain-1979-09090b?style=flat-square&labelColor=f97316)
![Precompile](https://img.shields.io/badge/Precompile-0x0802-22d3ee?style=flat-square)
![Model](https://img.shields.io/badge/Model-GLM--4.7--FP8-22c55e?style=flat-square)
![License](https://img.shields.io/badge/license-Clear%20BSD-blue?style=flat-square)

---

## What is Ritual Prompt Forge?

Ritual Prompt Forge is a dApp that leverages **Ritual Chain's LLM precompile (0x0802)** to generate optimized AI prompts. Users can:

- **Forge** — Describe what you want, get an optimized prompt via Ritual's on-chain LLM
- **Test** — Run prompts against the LLM to verify output quality
- **Mint** — Save prompts as NFTs on Ritual Chain for community sharing

### Why is this unique?

Looking at the [Community Ritual Dapps List](https://docs.google.com/spreadsheets/d/1-71yrtMqSRCTAvmshY2K_wDSYproX7GQFybKwkC5IFM/htmlview), existing dApps include games, PFP generators, prediction markets, and staking platforms. **No dApp currently uses the LLM precompile for prompt generation and minting.**

---

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript, Tailwind CSS
- **Web3:** wagmi, viem, @tanstack/react-query
- **Chain:** Ritual Chain (Chain ID: 1979)
- **LLM:** Ritual LLM Precompile (0x0802) — `zai-org/GLM-4.7-FP8`
- **Deployment:** Vercel

---

## Ritual Chain Integration

### LLM Precompile (0x0802)

The app uses Ritual's LLM precompile for on-chain AI inference:

```
┌──────────┐   call           ┌──────────────┐     inference     ┌─────────────┐
│  User Tx │ ──────────────▶ │  Precompile  │ ───────────────▶  │  LLM Model  │
│          │                 │   0x0802     │                   │  (in TEE)   │
└──────────┘                 └──────────────┘                   └─────────────┘
```

### Key Details

| Property | Value |
|----------|-------|
| Chain ID | `1979` |
| LLM Precompile | `0x0000000000000000000000000000000000000802` |
| Model | `zai-org/GLM-4.7-FP8` |
| RPC | `https://rpc.ritualfoundation.org` |
| Explorer | `https://explorer.ritualfoundation.org` |

### Integration with Real Ritual LLM

To connect with the actual Ritual LLM precompile:

1. Deploy a consumer contract that calls `0x0802`
2. Use viem to encode the 30-field ABI tuple
3. Send transaction via backend private key
4. Parse settled output from `spcCalls` in receipt

See [ritual-dapp-skills](https://github.com/ritual-foundation/ritual-dapp-skills) for full implementation patterns.

---

## Quick Start

### Prerequisites

- Node.js v20+
- npm or yarn

### Local Development

```bash
# Clone the repo
git clone https://github.com/your-username/ritual-prompt-forge.git
cd ritual-prompt-forge

# Install dependencies
npm install

# Start dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Build for Production

```bash
npm run build
npm start
```

---

## Deploy to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

### Option 2: GitHub Integration

1. Push to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Vercel auto-detects Next.js
5. Click Deploy

### Environment Variables

Set these in Vercel dashboard:

```
NEXT_PUBLIC_RITUAL_RPC_URL=https://rpc.ritualfoundation.org
NEXT_PUBLIC_RITUAL_CHAIN_ID=1979
NEXT_PUBLIC_RITUAL_EXPLORER=https://explorer.ritualfoundation.org
NEXT_PUBLIC_APP_NAME=Ritual Prompt Forge
NEXT_PUBLIC_APP_DESCRIPTION=AI Prompt Generator on Ritual Chain
```

---

## Project Structure

```
ritual-prompt-forge/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout
│   │   ├── page.tsx            # Main page (Forge, Library, Test)
│   │   ├── globals.css         # Global styles
│   │   └── api/
│   │       ├── generate/
│   │       │   └── route.ts    # LLM generation endpoint
│   │       └── prompts/
│   │           └── route.ts    # Prompt minting endpoint
│   └── lib/
│       ├── prompts.ts          # Prompt types, templates, examples
│       └── ritual.ts           # Ritual Chain config
├── vercel.json                 # Vercel deployment config
├── package.json
└── README.md
```

---

## Features

### ⚒️ Forge Mode
- 6 prompt categories (Code, Writing, Analysis, Creative, Business, Education)
- Real-time prompt generation via Ritual LLM
- Quick example templates
- One-click copy

### 📚 Library Mode
- Browse community prompts
- Filter by category
- View likes and mint counts
- Author attribution

### 🧪 Test Mode
- Test prompts with custom inputs
- Preview LLM output quality
- Iterate and refine before minting

### 💎 Mint Mode
- Mint prompts as NFTs on Ritual Chain
- On-chain metadata storage
- Transaction hash verification
- Explorer integration

---

## Contributing

1. Fork the repo
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

---

## Acknowledgments

- [Ritual Foundation](https://ritualfoundation.org) for the chain and precompiles
- [ritual-dapp-skills](https://github.com/ritual-foundation/ritual-dapp-skills) for documentation
- Community builders on the Ritual testnet

---

## License

Clear BSD License
