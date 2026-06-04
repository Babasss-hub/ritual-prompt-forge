import { defineChain } from "viem";

export const ritualChain = defineChain({
  id: 1979,
  name: "Ritual",
  nativeCurrency: {
    name: "RITUAL",
    symbol: "RITUAL",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [process.env.NEXT_PUBLIC_RITUAL_RPC_URL || "https://rpc.ritualfoundation.org"],
    },
  },
  blockExplorers: {
    default: {
      name: "Ritual Explorer",
      url: process.env.NEXT_PUBLIC_RITUAL_EXPLORER || "https://explorer.ritualfoundation.org",
    },
  },
});

// LLM Precompile Address
export const LLM_PRECOMPILE = "0x0000000000000000000000000000000000000802" as const;

// RitualWallet Address
export const RITUAL_WALLET = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948" as const;

// Default model for LLM inference
export const DEFAULT_MODEL = "zai-org/GLM-4.7-FP8";

// Prompt categories
export const PROMPT_CATEGORIES = [
  { id: "code", name: "Code", icon: "💻", color: "from-blue-500 to-cyan-500" },
  { id: "writing", name: "Writing", icon: "✍️", color: "from-purple-500 to-pink-500" },
  { id: "analysis", name: "Analysis", icon: "📊", color: "from-green-500 to-emerald-500" },
  { id: "creative", name: "Creative", icon: "🎨", color: "from-orange-500 to-red-500" },
  { id: "business", name: "Business", icon: "💼", color: "from-yellow-500 to-orange-500" },
  { id: "education", name: "Education", icon: "📚", color: "from-indigo-500 to-purple-500" },
] as const;

export type PromptCategory = (typeof PROMPT_CATEGORIES)[number]["id"];
