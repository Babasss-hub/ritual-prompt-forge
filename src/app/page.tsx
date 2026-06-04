"use client";

import { useState, useCallback } from "react";
import { EXAMPLE_PROMPTS, PROMPT_CATEGORIES, type Prompt } from "@/lib/prompts";

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

  const filteredPrompts =
    activeCategory === "all"
      ? EXAMPLE_PROMPTS
      : EXAMPLE_PROMPTS.filter((p) => p.category === activeCategory);

  const handleConnectWallet = useCallback(async () => {
    setIsConnecting(true);
    // Simulate wallet connection
    await new Promise((r) => setTimeout(r, 1000));
    setWalletAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18");
    setIsConnecting(false);
  }, []);

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

  const handleMint = useCallback(async () => {
    if (!generatedPrompt && !selectedPrompt) return;
    if (!walletAddress) {
      alert("Please connect your wallet first!");
      return;
    }

    setIsMinting(true);
    setTxHash("");
    setMintSuccess(false);

    try {
      const res = await fetch("/api/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: generatedPrompt || selectedPrompt?.prompt,
          title: selectedPrompt?.title || "Custom Prompt",
          description: selectedPrompt?.description || userInput,
          category: selectedPrompt?.category || activeCategory,
          author: walletAddress,
        }),
      });

      const data = await res.json();
      if (data.txHash) {
        setTxHash(data.txHash);
        setMintSuccess(true);
      }
    } catch {
      setTxHash("Error minting prompt");
    } finally {
      setIsMinting(false);
    }
  }, [generatedPrompt, selectedPrompt, walletAddress, userInput, activeCategory]);

  return (
    <div className="min-h-screen grid-pattern">
      {/* Header */}
      <header className="border-b border-[var(--ritual-border)] bg-[var(--ritual-dark)]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <span className="text-xl">⚡</span>
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
            <div className="flex items-center gap-3">
              {walletAddress ? (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/30">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm text-green-400 font-mono">
                    {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
                  </span>
                </div>
              ) : (
                <button
                  onClick={handleConnectWallet}
                  disabled={isConnecting}
                  className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-500 text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isConnecting ? "Connecting..." : "Connect Wallet"}
                </button>
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
            <span className="bg-gradient-to-r from-orange-400 via-red-400 to-pink-400 bg-clip-text text-transparent">
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
                <div className="text-2xl font-bold text-orange-400">
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
                          ? "border-orange-500/50 bg-orange-500/10"
                          : "border-[var(--ritual-border)] bg-[var(--ritual-card)] hover:border-orange-500/30"
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
                  className="w-full h-40 p-4 rounded-xl bg-[var(--ritual-card)] border border-[var(--ritual-border)] text-white placeholder-[var(--ritual-text)] focus:outline-none focus:border-orange-500/50 resize-none font-mono text-sm"
                />
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!userInput.trim() || isGenerating}
                className="w-full py-4 rounded-xl bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed glow-orange"
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
                      className="px-3 py-1.5 rounded-lg border border-[var(--ritual-border)] text-xs text-[var(--ritual-text)] hover:border-orange-500/30 hover:text-white transition-all"
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
                      className="text-xs text-orange-400 hover:text-orange-300"
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
                          <span className="w-4 h-4 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
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
                    className="flex-1 py-3 rounded-xl border border-orange-500/30 text-orange-400 font-medium hover:bg-orange-500/10 transition-colors"
                  >
                    🧪 Test Prompt
                  </button>
                  <button
                    onClick={handleMint}
                    disabled={!walletAddress || isMinting}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {isMinting ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Minting...
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
                        Prompt Minted Successfully!
                      </div>
                      <div className="text-xs text-green-400/70 mt-1 font-mono">
                        TX: {txHash}
                      </div>
                    </div>
                  ) : (
                    <div className="text-red-400 text-sm">{txHash}</div>
                  )}
                </div>
              )}

              {/* Ritual Info */}
              <div className="p-4 rounded-xl bg-[var(--ritual-card)] border border-[var(--ritual-border)]">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-orange-500" />
                  <span className="text-sm font-medium text-orange-400">
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
                    ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
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
                        ? "bg-orange-500/20 text-orange-400 border border-orange-500/30"
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
                  className="text-sm text-orange-400 hover:text-orange-300"
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
                    className="text-xs text-orange-400 hover:text-orange-300"
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
                  className="w-full h-32 p-4 rounded-xl bg-[var(--ritual-card)] border border-[var(--ritual-border)] text-white placeholder-[var(--ritual-text)] focus:outline-none focus:border-orange-500/50 resize-none font-mono text-sm"
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
                <p className="text-sm text-[var(--ritual-text)] mb-4">
                  Save this prompt as an NFT on Ritual Chain. It will be
                  stored on-chain and shareable with the community.
                </p>
                <button
                  onClick={handleMint}
                  disabled={!walletAddress || isMinting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {isMinting ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Minting on Ritual Chain...
                    </span>
                  ) : walletAddress ? (
                    "💎 Mint Prompt NFT"
                  ) : (
                    "Connect Wallet to Mint"
                  )}
                </button>
              </div>

              {/* Mint Result */}
              {txHash && mintSuccess && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-center">
                  <div className="text-3xl mb-2">🎉</div>
                  <div className="text-green-400 font-medium">
                    Successfully Minted!
                  </div>
                  <div className="text-xs text-green-400/70 mt-2 font-mono">
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
              <span className="w-2 h-2 rounded-full bg-orange-500" />
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
