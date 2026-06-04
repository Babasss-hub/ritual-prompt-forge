import { NextResponse } from "next/server";

// In-memory store for demo (would be a database in production)
const prompts: Array<{
  id: string;
  prompt: string;
  title: string;
  description: string;
  category: string;
  author: string;
  createdAt: number;
}> = [];

export async function GET() {
  return NextResponse.json({ prompts });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt, title, description, category, author } = body;

    if (!prompt || !author) {
      return NextResponse.json(
        { error: "Prompt and author are required" },
        { status: 400 }
      );
    }

    // In production, this would:
    // 1. Encode prompt data as calldata
    // 2. Call a RitualChain NFT contract to mint
    // 3. Return the transaction hash

    // Simulate minting on Ritual Chain
    const txHash = `0x${Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join("")}`;

    const newPrompt = {
      id: Date.now().toString(),
      prompt,
      title: title || "Untitled Prompt",
      description: description || "",
      category: category || "general",
      author,
      createdAt: Date.now(),
    };

    prompts.push(newPrompt);

    return NextResponse.json({
      success: true,
      txHash,
      prompt: newPrompt,
      message: "Prompt minted on Ritual Chain (simulated)",
      chainId: 1979,
      contractAddress: "0x0000000000000000000000000000000000000000",
    });
  } catch (error) {
    console.error("Mint error:", error);
    return NextResponse.json(
      { error: "Failed to mint prompt" },
      { status: 500 }
    );
  }
}
