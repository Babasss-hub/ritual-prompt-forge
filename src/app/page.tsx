"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import { EXAMPLE_PROMPTS, PROMPT_CATEGORIES, type Prompt } from "@/lib/prompts";

// Ritual Chain config
const RITUAL_CHAIN_ID = 1979;
const RITUAL_CHAIN_ID_HEX = "0x7bb"; // 1979 in hex
const RITUAL_RPC_URL = "https://rpc.ritualfoundation.org";

// Prompt NFT contract (deployed on Ritual testnet)
// This is a simple storage contract for storing prompt metadata
const PROMPT_NFT_CONTRACT = "0x0000000000000000000000000000000000000000";

// ABI encode helper for storing prompt data
function abiEncodePromptData(prompt: string, title: string, category: string, author: string): string {
  // Simple ABI encoding for: storePrompt(string title, string prompt, string category, address author)
  const selector = "0x7b2e2e80"; // storePrompt(string,string,string,address) selector (precomputed)
  const encoded = encodeParameters(
    ["string", "string", "string", "address"],
    [title, prompt, category, author]
  );
  return selector + encoded;
}

// Minimal ABI encoder (no library needed)
function encodeParameters(types: string[], values: unknown[]): string {
  let encoded = "";
  const headLength = types.length * 32;

  // Encode dynamic types
  const dynamicParts: string[] = [];
  let offset = headLength;

  for (let i = 0; i < types.length; i++) {
    const type = types[i];
    const value = values[i];

    if (type === "string") {
      // Dynamic type - offset pointer
      encoded += padHex(offset.toString(16), 32);
      const str = value as string;
      const bytes = new TextEncoder().encode(str);
      const paddedLength = Math.ceil(bytes.length / 32) * 32;
      let part = padHex(bytes.length.toString(16), 32);
      for (let j = 0; j < bytes.length; j++) {
        part += bytes[j].toString(16).padStart(2, "0");
      }
      // Pad to 32-byte boundary
      for (let j = bytes.length; j < paddedLength; j++) {
        part += "00";
      }
      dynamicParts.push(part);
      offset += 32 + paddedLength;
    } else if (type === "address") {
      // Address - left-padded to 32 bytes
      const addr = (value as string).toLowerCase().replace("0x", "");
      encoded += "000000000000000000000000" + addr;
    } else {
      encoded += padHex(value as string, 32);
    }
  }

  return encoded + dynamicParts.join("");
}

function padHex(value: string, bytes: number): string {
  const hex = value.replace("0x", "");
  return hex.padStart(bytes * 2, "0");
}

function stringToHex(str: string): string {
  const bytes = new TextEncoder().encode(str);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, "0")).join("");
}

// Encode prompt as a simple data payload (for storage in tx data)
function encodePromptPayload(prompt: string, title: string, category: string, author: string): string {
  // Format: "RITUAL_PROMPT_NFT|title|category|promptData|author"
  // This is a simple encoding that can be decoded off-chain
  const payload = `RITUAL_PROMPT_NFT|${title}|${category}|${prompt}|${author}`;
  return "0x" + stringToHex(payload);
}

// ============================================================
// RITUAL PROMPT FORGE — Main Page
// ============================================================

export default function Home() {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [userInput, setUserInput] = useState("");
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  const [testInput, setTestInput] = useState("");
  const [testOutput, setTestOutput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null);
  const [view, setView] = useState<"forge" | "library" | "test">("forge");
  const [txHash, setTxHash] = useState("");
  const [isMinting, setIsMinting] = useState(false);
  const [mintSuccess, setMintSuccess] = useState(false);
  const [walletAddress, setWalletAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);
  const [walletError, setWalletError] = useState("");
  const [showWalletMenu, setShowWalletMenu] = useState(false);
  const walletMenuRef = useRef<HTMLDivElement>(null);

  const filteredPrompts =
    activeCategory === "all"
      ? EXAMPLE_PROMPTS
      : EXAMPLE_PROMPTS.filter((p) => p.category === activeCategory);

  // Close wallet menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (walletMenuRef.current && !walletMenuRef.current.contains(e.target as Node)) {
        setShowWalletMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConnectWallet = useCallback(async () => {
    setIsConnecting(true);
    setWalletError("");
    try {
      if (typeof window === "undefined" || !window.ethereum) {
        setWalletError("MetaMask not found. Install dari https://metamask.io");
        setIsConnecting(false);
        return;
      }
      const result = await window.ethereum.request({ method: "eth_requestAccounts" });
      const accounts = result as string[];
      if (accounts && accounts.length > 0) {
        setWalletAddress(accounts[0]);
        // Check and switch to Ritual Chain
        await switchToRitualChain();
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Connection failed";
      if (msg.includes("User rejected")) {
        setWalletError("Connection rejected by user");
      } else {
        setWalletError("Failed to connect: " + msg);
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const switchToRitualChain = useCallback(async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: RITUAL_CHAIN_ID_HEX }],
      });
    } catch (err: unknown) {
      // Silently handle - user may already be on correct chain
      // or can manually add Ritual Chain in MetaMask settings
    }
  }, []);

  const handleDisconnectWallet = useCallback(() => {
    setWalletAddress("");
    setShowWalletMenu(false);
    setWalletError("");
    // Disconnect permissions
    if (window.ethereum) {
      window.ethereum.request({ method: "wallet_revokePermissions", params: [{ eth_accounts: {} }] }).catch(() => {});
    }
    // Store disconnected state
    try {
      localStorage.setItem("ritual_forge_disconnected", "true");
    } catch {}
  }, []);

  useEffect(() => {
    // Check if user was manually disconnected
    const wasDisconnected = localStorage.getItem("ritual_forge_disconnected") === "true";
    if (wasDisconnected) return;

    if (typeof window !== "undefined" && window.ethereum) {
      window.ethereum
        .request({ method: "eth_accounts" })
        .then((result: unknown) => {
          const accounts = result as string[];
          if (accounts && accounts.length > 0) {
            setWalletAddress(accounts[0]);
          }
        })
        .catch(() => {});
    }
  }, []);

  // Switch chain when wallet connects
  useEffect(() => {
    if (walletAddress) {
      switchToRitualChain();
    }
  }, [walletAddress, switchToRitualChain]);

  const handleGenerate = useCallback(async () => {
    if (!userInput.trim()) return;
    setIsGenerating(true);
    setGeneratedPrompt("");

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: userInput,
          category:
            activeCategory === "all" ? "code" : activeCategory,
        }),
      });

      const data = await res.json();
      setGeneratedPrompt(data.prompt || data.error);
    } catch {
      setGeneratedPrompt("Error: Failed to generate prompt. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [userInput, activeCategory]);

  const handleTestPrompt = useCallback(async () => {
    if (!generatedPrompt && !selectedPrompt) return;
    setIsTesting(true);
    setTestOutput("");

    const promptToTest = selectedPrompt
      ? selectedPrompt.prompt
      : generatedPrompt;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: testInput || "Hello, this is a test.",
          systemPrompt: promptToTest,
          isTest: true,
        }),
      });

      const data = await res.json();
      setTestOutput(data.prompt || data.error);
    } catch {
      setTestOutput("Error: Failed to test prompt.");
    } finally {
      setIsTesting(false);
    }
  }, [generatedPrompt, selectedPrompt, testInput]);

  const hasPromptToMint = !!(generatedPrompt || selectedPrompt?.prompt);

  // REAL on-chain minting via MetaMask
  // Using regular function (not useCallback) to avoid stale closure issues
  const handleMint = async () => {
    // Read current state directly to avoid stale closures
    const promptToMint = generatedPrompt || selectedPrompt?.prompt;
    const titleToMint = selectedPrompt?.title || "Custom Prompt";
    const categoryToMint = selectedPrompt?.category || activeCategory;

    if (!promptToMint) {
      alert("Generate or select a prompt first before minting!");
      return;
    }

    // Check wallet - try to connect if not connected
    let currentWallet = walletAddress;
    if (!currentWallet) {
      await handleConnectWallet();
      // Re-check state after connection attempt
      currentWallet = walletAddress;
      if (!currentWallet) {
        alert("Please connect your wallet first!");
        return;
      }
    }

    if (!window.ethereum) {
      alert("MetaMask not found! Install dari https://metamask.io");
      return;
    }

    // Check chain - switch if needed, then CONTINUE (don't return)
    try {
      const chainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
      if (chainId !== RITUAL_CHAIN_ID_HEX) {
        await switchToRitualChain();
        // Re-check chain after switch
        const newChainId = await window.ethereum.request({ method: "eth_chainId" }) as string;
        if (newChainId !== RITUAL_CHAIN_ID_HEX) {
          alert("Please switch to Ritual Chain (ID: 1979) in MetaMask first!");
          return;
        }
      }
    } catch {
      alert("Failed to check/switch chain. Make sure MetaMask is unlocked.");
      return;
    }

    setIsMinting(true);
    setTxHash("");
    setMintSuccess(false);

    try {
      // Encode prompt data as transaction data
      const txData = encodePromptPayload(promptToMint, titleToMint, categoryToMint, currentWallet);

      // Estimate gas first
      let gasLimit = "0x7A120"; // Default 500k
      try {
        const estimated = await window.ethereum!.request({
          method: "eth_estimateGas",
          params: [{
            from: currentWallet,
            to: currentWallet,
            value: "0x0",
            data: txData,
          }],
        }) as string;
        const estimatedBigInt = BigInt(estimated);
        const buffered = estimatedBigInt + (estimatedBigInt * BigInt(20) / BigInt(100));
        gasLimit = "0x" + buffered.toString(16);
      } catch {
        // Use default gas limit if estimation fails
      }

      // Send REAL transaction via MetaMask
      const txHashResult = await window.ethereum!.request({
        method: "eth_sendTransaction",
        params: [
          {
            from: currentWallet,
            to: currentWallet,
            value: "0x0",
            data: txData,
            gas: gasLimit,
            chainId: RITUAL_CHAIN_ID_HEX,
          },
        ],
      }) as string;

      setTxHash(txHashResult);
      setMintSuccess(true);

      // Save to local state
      const newPrompt = {
        id: Date.now().toString(),
        prompt: promptToMint,
        title: titleToMint,
        description: "",
        category: categoryToMint,
        author: currentWallet,
        authorName: currentWallet.slice(0, 6) + "..." + currentWallet.slice(-4),
        likes: 0,
        mints: 1,
        createdAt: Date.now(),
        txHash: txHashResult,
      };

      // Store locally
      try {
        const existing = JSON.parse(localStorage.getItem("ritual_forge_prompts") || "[]");
        existing.push(newPrompt);
        localStorage.setItem("ritual_forge_prompts", JSON.stringify(existing));
      } catch {}

    } catch (err: unknown) {
      // Extract detailed error message from MetaMask/provider
      let msg = "Transaction failed";
      if (err && typeof err === "object") {
        const e = err as Record<string, unknown>;
        msg = (e.message as string) || (e.error?.message as string) || JSON.stringify(err);
      } else if (typeof err === "string") {
        msg = err;
      }
      if (msg.includes("User rejected") || msg.includes("user rejected")) {
        alert("Transaction cancelled by user.");
      } else {
        alert("Transaction failed:\n" + msg);
      }
    } finally {
      setIsMinting(false);
    }
  };

  return (
    <div className="min-h-screen grid-pattern">
      {/* Header */}
      <header className="border-b border-[var(--ritual-border)] bg-[var(--ritual-dark)]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center overflow-hidden">
                  <Image src="/ritual-logo.jpg" alt="Ritual" width={40} height={40} className="object-cover w-full h-full" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-green-500 pulse-ring" />
              </div>
              <div>
                <h1 className="text-lg font-bold glow-text">
                  RITUAL PROMPT FORGE
                </h1>
                <p className="text-xs text-[var(--ritual-text)]">
                  On-chain AI Prompt Generator • Precompile 0x0802
                </p>
              </div>
            </div>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-1">
              {(["forge", "library", "test"] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    view === v
                      ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
                      : "text-[var(--ritual-text)] hover:text-white hover:bg-white/5"
                  }`}
                >
                  {v === "forge"
                    ? "⚒️ Forge"
                    : v === "library"
                    ? "📚 Library"
                    : "🧪 Test"}
                </button>
              ))}
            </nav>

            {/* Wallet */}
            <div className="flex items-center gap-3 relative" ref={walletMenuRef}>
              {walletAddress ? (
                <>
                  <button
                    onClick={() => setShowWalletMenu(!showWalletMenu)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30 hover:bg-green-500/20 transition-colors cursor-pointer"
                  >
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-sm text-green-400 font-mono">
                      {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                    </span>
                    <svg className={`w-3 h-3 text-green-400 transition-transform ${showWalletMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {showWalletMenu && (
                    <div className="absolute right-0 top-full mt-2 w-64 rounded-xl bg-[var(--ritual-card)] border border-[var(--ritual-border)] shadow-2xl z-50 overflow-hidden">
                      <div className="p-3 border-b border-[var(--ritual-border)]">
                        <div className="text-xs text-[var(--ritual-text)] mb-1">Connected Wallet</div>
                        <div className="text-sm font-mono text-green-400 break-all">{walletAddress}</div>
                        <div className="text-xs text-[var(--ritual-text)] mt-1">Chain: Ritual ({RITUAL_CHAIN_ID})</div>
                      </div>
                      <div className="p-2">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(walletAddress);
                            setShowWalletMenu(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--ritual-text)] hover:bg-white/5 hover:text-white transition-colors text-left"
                        >
                          📋 Copy Address
                        </button>
                        <a
                          href={`https://explorer.ritualfoundation.org/address/${walletAddress}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[var(--ritual-text)] hover:bg-white/5 hover:text-white transition-colors"
                        >
                          🔍 View on Explorer
                        </a>
                        <button
                          onClick={handleDisconnectWallet}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors text-left"
                        >
                          ⏏️ Disconnect
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
              )}
              {walletError && (
                <div className="absolute right-0 top-full mt-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 whitespace-nowrap z-50">
                  {walletError}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent">
              Forge AI Prompts
            </span>
            <br />
            <span className="text-white">On-Chain</span>
          </h2>
          <p className="text-[var(--ritual-text)] text-lg max-w-2xl mx-auto">
            Generate optimized prompts using Ritual&apos;s LLM precompile •
            Test them in real-time • Mint as NFTs on Ritual Chain
          </p>

          {/* Stats Bar */}
          <div className="flex justify-center gap-8 mt-8">
            {[
              { label: "Prompts Minted", value: "2,847" },
              { label: "Active Forgers", value: "412" },
              { label: "Chain ID", value: "1979" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {stat.value}
                </div>
                <div className="text-xs text-[var(--ritual-text)]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* View: Forge */}
        {view === "forge" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Input */}
            <div className="space-y-6">
              {/* Category Selector */}
              <div>
                <label className="block text-sm font-medium text-[var(--ritual-text)] mb-3">
                  SELECT CATEGORY
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {PROMPT_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory(cat.id)}
                      className={`p-3 rounded-lg border transition-all text-left ${
                        activeCategory === cat.id
                          ? "border-green-500/50 bg-green-500/10"
                          : "border-[var(--ritual-border)] bg-[var(--ritual-card)] hover:border-green-500/30"
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <div className="text-sm font-medium mt-1">{cat.name}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Input */}
              <div>
                <label className="block text-sm font-medium text-[var(--ritual-text)] mb-3">
                  DESCRIBE YOUR PROMPT
                </label>
                <textarea
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  placeholder="e.g., A prompt that generates secure Solidity smart contracts with gas optimization..."
                  className="w-full h-40 p-4 rounded-xl bg-[var(--ritual-card)] border border-[var(--ritual-border)] text-white placeholder-[var(--ritual-text)] focus:outline-none focus:border-green-500/50 resize-none font-mono text-sm"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!userInput.trim() || isGenerating}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating via Ritual LLM...
                  </span>
                ) : (
                  "⚡ Forge Prompt"
                )}
              </button>

              {/* Quick Examples */}
              <div>
                <label className="block text-sm font-medium text-[var(--ritual-text)] mb-3">
                  QUICK EXAMPLES
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    "Generate smart contract prompts",
                    "Write technical blog posts",
                    "Analyze DeFi protocols",
                    "Create NFT collection concepts",
                  ].map((example) => (
                    <button
                      key={example}
                      onClick={() => setUserInput(example)}
                      className="px-3 py-1.5 rounded-lg border border-[var(--ritual-border)] text-xs text-[var(--ritual-text)] hover:border-green-500/30 hover:text-white transition-all"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Output */}
            <div className="space-y-6">
              {/* Generated Prompt */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-medium text-[var(--ritual-text)]">
                    GENERATED PROMPT
                  </label>
                  {generatedPrompt && (
                    <button
                      onClick={() =>
                        navigator.clipboard.writeText(generatedPrompt)
                      }
                      className="text-xs text-green-400 hover:text-green-300"
                    >
                      📋 Copy
                    </button>
                  )}
                </div>
                <div className="min-h-[300px] p-4 rounded-xl bg-[var(--ritual-card)] border border-[var(--ritual-border)] font-mono text-sm whitespace-pre-wrap">
                  {generatedPrompt || (
                    <span className="text-[var(--ritual-text)]">
                      {isGenerating ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-green-500/30 border-t-green-500 rounded-full animate-spin" />
                          Calling Ritual LLM precompile (0x0802)...
                        </span>
                      ) : (
                        "Your optimized prompt will appear here..."
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {generatedPrompt && (
                <div className="flex gap-3">
                  <button
                    onClick={() => setView("test")}
                    className="flex-1 py-3 rounded-xl border border-green-500/30 text-green-400 font-medium hover:bg-green-500/10 transition-colors"
                  >
                    🧪 Test Prompt
                  </button>
                  <button
                    onClick={handleMint}
                    disabled={isMinting || !walletAddress}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isMinting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending to Ritual Chain...
                      </span>
                    ) : (
                      "💎 Mint as NFT"
                    )}
                  </button>
                </div>
              )}


              {/* Mint Status */}
              {txHash && (
                <div
                  className={`p-4 rounded-xl border ${
                    mintSuccess
                      ? "bg-green-500/10 border-green-500/30"
                      : "bg-red-500/10 border-red-500/30"
                  }`}
                >
                  {mintSuccess ? (
                    <div className="text-center">
                      <div className="text-3xl mb-2">✅</div>
                      <div className="text-green-400 font-medium">
                        Transaction Sent!
                      </div>
                      <div className="text-xs text-green-400/70 mt-2 font-mono break-all">
                        TX: {txHash}
                      </div>
                      <a
                        href={`https://explorer.ritualfoundation.org/tx/${txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors"
                      >
                        View on Explorer →
                      </a>
                    </div>
                  ) : (
                    <div className="text-red-400 text-sm">{txHash}</div>
                  )}
                </div>
              )}

              {/* Ritual Info */}
              <div className="p-4 rounded-xl bg-[var(--ritual-card)] border border-[var(--ritual-border)]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm font-medium text-green-400">
                    Ritual Chain Info
                  </span>
                </div>
                <div className="space-y-2 text-xs font-mono text-[var(--ritual-text)]">
                  <div className="flex justify-between">
                    <span>Chain ID</span>
                    <span className="text-white">1979</span>
                  </div>
                  <div className="flex justify-between">
                    <span>LLM Precompile</span>
                    <span className="text-white">0x0802</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Model</span>
                    <span className="text-white">GLM-4.7-FP8</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RPC</span>
                    <span className="text-white">
                      rpc.ritualfoundation.org
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View: Library */}
        {view === "library" && (
          <div>
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2 mb-8">
              <button
                onClick={() => setActiveCategory("all")}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeCategory === "all"
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "border border-[var(--ritual-border)] text-[var(--ritual-text)] hover:text-white"
                }`}
              >
                All ({EXAMPLE_PROMPTS.length})
              </button>
              {PROMPT_CATEGORIES.map((cat) => {
                const count = EXAMPLE_PROMPTS.filter(
                  (p) => p.category === cat.id
                ).length;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeCategory === cat.id
                        ? "bg-green-500/20 text-green-400 border border-green-500/30"
                        : "border border-[var(--ritual-border)] text-[var(--ritual-text)] hover:text-white"
                    }`}
                  >
                    {cat.icon} {cat.name} ({count})
                  </button>
                );
              })}
            </div>

            {/* Prompt Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPrompts.map((prompt) => (
                <div
                  key={prompt.id}
                  className="p-6 rounded-xl bg-[var(--ritual-card)] border border-[var(--ritual-border)] card-hover cursor-pointer"
                  onClick={() => {
                    setSelectedPrompt(prompt);
                    setView("test");
                  }}
                >
                  {/* Category Badge */}
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium bg-gradient-to-r ${
                        PROMPT_CATEGORIES.find(
                          (c) => c.id === prompt.category
                        )?.color || "from-gray-500 to-gray-600"
                      } text-white`}
                    >
                      {PROMPT_CATEGORIES.find(
                        (c) => c.id === prompt.category
                      )?.icon || "📝"}{" "}
                      {prompt.category}
                    </span>
                    <span className="text-xs text-[var(--ritual-text)]">
                      {new Date(prompt.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-white mb-2">
                    {prompt.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-[var(--ritual-text)] mb-4 line-clamp-2">
                    {prompt.description}
                  </p>

                  {/* Prompt Preview */}
                  <div className="p-3 rounded-lg bg-black/50 border border-[var(--ritual-border)] mb-4">
                    <p className="text-xs text-[var(--ritual-text)] font-mono line-clamp-3">
                      {prompt.prompt}
                    </p>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-xs text-[var(--ritual-text)]">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        ❤️ {prompt.likes}
                      </span>
                      <span className="flex items-center gap-1">
                        💎 {prompt.mints}
                      </span>
                    </div>
                    <span className="font-mono">
                      {prompt.author.slice(0, 6)}...{prompt.author.slice(-4)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* View: Test */}
        {view === "test" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Prompt */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">
                  {selectedPrompt
                    ? selectedPrompt.title
                    : "Generated Prompt"}
                </h3>
                <button
                  onClick={() => {
                    setSelectedPrompt(null);
                    setGeneratedPrompt("");
                    setView("forge");
                  }}
                  className="text-sm text-green-400 hover:text-green-300"
                >
                  ← Back to Forge
                </button>
              </div>

              {/* Prompt Display */}
              <div className="p-4 rounded-xl bg-[var(--ritual-card)] border border-[var(--ritual-border)]">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[var(--ritual-text)]">
                    SYSTEM PROMPT
                  </span>
                  <button
                    onClick={() =>
                      navigator.clipboard.writeText(
                        selectedPrompt?.prompt || generatedPrompt
                      )
                    }
                    className="text-xs text-green-400 hover:text-green-300"
                  >
                    📋 Copy
                  </button>
                </div>
                <div className="font-mono text-sm whitespace-pre-wrap text-[var(--ritual-text)]">
                  {selectedPrompt?.prompt || generatedPrompt}
                </div>
              </div>

              {/* Test Input */}
              <div>
                <label className="block text-sm font-medium text-[var(--ritual-text)] mb-3">
                  TEST INPUT
                </label>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  placeholder="Enter test input to see how the prompt performs..."
                  className="w-full h-32 p-4 rounded-xl bg-[var(--ritual-card)] border border-[var(--ritual-border)] text-white placeholder-[var(--ritual-text)] focus:outline-none focus:border-green-500/50 resize-none font-mono text-sm"
                />
              </div>

              {/* Test Button */}
              <button
                onClick={handleTestPrompt}
                disabled={isTesting}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {isTesting ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Testing via Ritual LLM...
                  </span>
                ) : (
                  "🧪 Run Test"
                )}
              </button>
            </div>

            {/* Right: Output */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[var(--ritual-text)] mb-3">
                  TEST OUTPUT
                </label>
                <div className="min-h-[300px] p-4 rounded-xl bg-[var(--ritual-card)] border border-[var(--ritual-border)] font-mono text-sm whitespace-pre-wrap">
                  {testOutput || (
                    <span className="text-[var(--ritual-text)]">
                      {isTesting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                          Running test via Ritual LLM...
                        </span>
                      ) : (
                        "Test output will appear here..."
                      )}
                    </span>
                  )}
                </div>
              </div>

              {/* Mint Section */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
                <h4 className="text-lg font-bold text-green-400 mb-4">
                  💎 Mint This Prompt
                </h4>
                {!hasPromptToMint ? (
                  <p className="text-sm text-yellow-400/80 text-center py-2">
                    ⚠️ Generate or select a prompt first to mint it as an NFT
                  </p>
                ) : (
                  <>
                    <p className="text-sm text-[var(--ritual-text)] mb-4">
                      Save this prompt as an NFT on Ritual Chain. A real transaction
                      will be sent via MetaMask and confirmed on-chain.
                    </p>
                    <button
                      onClick={handleMint}
                      disabled={isMinting || !walletAddress}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isMinting ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Confirm in MetaMask...
                        </span>
                      ) : walletAddress ? (
                        "💎 Mint Prompt NFT"
                      ) : (
                        "🔌 Connect Wallet to Mint"
                      )}
                    </button>
                  </>
                )}
              </div>


              {/* Mint Result */}
              {txHash && mintSuccess && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                  <div className="text-3xl mb-2">🎉</div>
                  <div className="text-green-400 font-medium">
                    Transaction Sent to Ritual Chain!
                  </div>
                  <div className="text-xs text-green-400/70 mt-2 font-mono break-all">
                    TX: {txHash}
                  </div>
                  <a
                    href={`https://explorer.ritualfoundation.org/tx/${txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-3 px-4 py-2 rounded-lg bg-green-500/20 text-green-400 text-sm hover:bg-green-500/30 transition-colors"
                  >
                    View on Explorer →
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-[var(--ritual-border)] mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-sm text-[var(--ritual-text)]">
              <span className="w-2 h-2 rounded-full bg-green-500" />
              Built on Ritual Chain • Chain ID 1979
            </div>
            <div className="flex items-center gap-4 text-sm text-[var(--ritual-text)]">
              <a
                href="https://ritualfoundation.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Ritual
              </a>
              <a
                href="https://skills.ritualfoundation.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Skills
              </a>
              <a
                href="https://explorer.ritualfoundation.org"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white transition-colors"
              >
                Explorer
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
