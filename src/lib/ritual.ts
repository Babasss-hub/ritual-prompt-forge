// Ritual Chain Configuration
export const RITUAL_CHAIN_ID = 1979;
export const RITUAL_RPC_URL = process.env.NEXT_PUBLIC_RITUAL_RPC_URL || "https://rpc.ritualfoundation.org";
export const RITUAL_EXPLORER = process.env.NEXT_PUBLIC_RITUAL_EXPLORER || "https://explorer.ritualfoundation.org";

// LLM Precompile Address
export const LLM_PRECOMPILE = "0x0000000000000000000000000000000000000802" as const;

// RitualWallet Address
export const RITUAL_WALLET = "0x532F0dF0896F353d8C3DD8cc134e8129DA2a3948" as const;

// Default model for LLM inference
export const DEFAULT_MODEL = "zai-org/GLM-4.7-FP8";
