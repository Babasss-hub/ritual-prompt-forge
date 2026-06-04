export interface Prompt {
  id: string;
  title: string;
  description: string;
  category: string;
  prompt: string;
  exampleOutput: string;
  author: string;
  authorName: string;
  likes: number;
  mints: number;
  createdAt: number;
  txHash?: string;
}

export const PROMPT_CATEGORIES = [
  { id: "code", name: "Code", icon: "💻", color: "from-blue-500 to-cyan-500" },
  { id: "writing", name: "Writing", icon: "✍️", color: "from-purple-500 to-pink-500" },
  { id: "analysis", name: "Analysis", icon: "📊", color: "from-green-500 to-emerald-500" },
  { id: "creative", name: "Creative", icon: "🎨", color: "from-orange-500 to-red-500" },
  { id: "business", name: "Business", icon: "💼", color: "from-yellow-500 to-orange-500" },
  { id: "education", name: "Education", icon: "📚", color: "from-indigo-500 to-purple-500" },
] as const;

export interface PromptTemplate {
  category: string;
  systemPrompt: string;
  userTemplate: string;
}

export const PROMPT_TEMPLATES: Record<string, PromptTemplate> = {
  code: {
    category: "code",
    systemPrompt: `You are an expert prompt engineer specializing in code generation prompts.
Your task is to take a user's description of what they want to build and transform it into a detailed, structured prompt that will produce high-quality code.

The generated prompt should include:
1. Clear specification of the programming language and framework
2. Detailed requirements and constraints
3. Input/output examples
4. Error handling expectations
5. Code style preferences

Output ONLY the optimized prompt, nothing else.`,
    userTemplate: `Transform this description into an optimized code generation prompt:

"{input}"

Make it specific, actionable, and detailed enough to generate production-ready code.`,
  },
  writing: {
    category: "writing",
    systemPrompt: `You are an expert prompt engineer specializing in writing and content creation prompts.
Your task is to take a user's writing goal and transform it into a detailed, structured prompt that will produce compelling content.

The generated prompt should include:
1. Clear tone and style specifications
2. Target audience definition
3. Structure and format requirements
4. Key themes and messages to include
5. Word count or length guidance

Output ONLY the optimized prompt, nothing else.`,
    userTemplate: `Transform this writing goal into an optimized content creation prompt:

"{input}"

Make it specific enough to produce high-quality, engaging content.`,
  },
  analysis: {
    category: "analysis",
    systemPrompt: `You are an expert prompt engineer specializing in analytical and research prompts.
Your task is to take a user's analysis goal and transform it into a detailed, structured prompt that will produce thorough, insightful analysis.

The generated prompt should include:
1. Clear scope and boundaries
2. Methodology preferences
3. Data sources to consider
4. Framework or lens to apply
5. Expected output format

Output ONLY the optimized prompt, nothing else.`,
    userTemplate: `Transform this analysis goal into an optimized research prompt:

"{input}"

Make it specific enough to produce deep, actionable insights.`,
  },
  creative: {
    category: "creative",
    systemPrompt: `You are an expert prompt engineer specializing in creative and artistic prompts.
Your task is to take a user's creative vision and transform it into a detailed, evocative prompt that will produce inspiring creative work.

The generated prompt should include:
1. Vivid sensory details and mood
2. Style and artistic references
3. Creative constraints that spark innovation
4. Emotional tone and atmosphere
5. Format and medium specifications

Output ONLY the optimized prompt, nothing else.`,
    userTemplate: `Transform this creative vision into an optimized creative prompt:

"{input}"

Make it vivid, inspiring, and specific enough to spark amazing creative work.`,
  },
  business: {
    category: "business",
    systemPrompt: `You are an expert prompt engineer specializing in business and strategy prompts.
Your task is to take a user's business goal and transform it into a detailed, structured prompt that will produce actionable business insights.

The generated prompt should include:
1. Clear business context and constraints
2. Metrics and KPIs to consider
3. Stakeholder perspectives
4. Risk assessment framework
5. Actionable recommendations format

Output ONLY the optimized prompt, nothing else.`,
    userTemplate: `Transform this business goal into an optimized strategy prompt:

"{input}"

Make it specific enough to produce actionable, data-driven business recommendations.`,
  },
  education: {
    category: "education",
    systemPrompt: `You are an expert prompt engineer specializing in educational and learning prompts.
Your task is to take a user's learning objective and transform it into a detailed, structured prompt that will produce effective educational content.

The generated prompt should include:
1. Learning level and prerequisites
2. Teaching methodology preferences
3. Examples and exercises format
4. Assessment criteria
5. Engagement techniques

Output ONLY the optimized prompt, nothing else.`,
    userTemplate: `Transform this learning objective into an optimized educational prompt:

"{input}"

Make it specific enough to produce engaging, effective educational content.`,
  },
};

export const EXAMPLE_PROMPTS: Prompt[] = [
  {
    id: "1",
    title: "Solidity Smart Contract Generator",
    description: "Generate secure, gas-optimized Solidity smart contracts with best practices",
    category: "code",
    prompt: "Write a Solidity smart contract for [CONTRACT_NAME] that implements [FUNCTIONALITY]. Use Solidity ^0.8.20, follow OpenZeppelin patterns, include comprehensive NatSpec documentation, implement reentrancy guards where applicable, optimize for gas efficiency, and include events for all state changes. Provide deployment scripts and test cases.",
    exampleOutput: "A complete Solidity contract with imports, constructor, functions, events, modifiers, and accompanying test file.",
    author: "0x1234...5678",
    authorName: "PromptMaster",
    likes: 42,
    mints: 15,
    createdAt: Date.now() - 86400000 * 3,
  },
  {
    id: "2",
    title: "Technical Blog Post Writer",
    description: "Create engaging technical blog posts that explain complex topics simply",
    category: "writing",
    prompt: "Write a technical blog post about [TOPIC] targeting [AUDIENCE_LEVEL] developers. Structure: hook introduction, clear explanation with analogies, code examples, common pitfalls section, and actionable takeaways. Tone: conversational yet authoritative. Include diagrams descriptions. Target length: 1500-2000 words.",
    exampleOutput: "A well-structured blog post with engaging hooks, clear explanations, and practical code examples.",
    author: "0xabcd...ef01",
    authorName: "TechWriter",
    likes: 38,
    mints: 12,
    createdAt: Date.now() - 86400000 * 2,
  },
  {
    id: "3",
    title: "DeFi Protocol Analyzer",
    description: "Analyze DeFi protocols for risks, opportunities, and tokenomics",
    category: "analysis",
    prompt: "Analyze the [PROTOCOL_NAME] DeFi protocol. Evaluate: TVL trends, smart contract risks, tokenomics model, yield sources sustainability, competitive positioning, governance structure, and oracle dependencies. Provide a risk score (1-10) with justification. Format findings as a structured report with executive summary.",
    exampleOutput: "A comprehensive DeFi protocol analysis with risk assessment, charts descriptions, and investment thesis.",
    author: "0x9876...5432",
    authorName: "DeFiAnalyst",
    likes: 56,
    mints: 23,
    createdAt: Date.now() - 86400000,
  },
  {
    id: "4",
    title: "NFT Collection Concept Creator",
    description: "Generate unique NFT collection concepts with lore and metadata",
    category: "creative",
    prompt: "Create an NFT collection concept for [THEME]. Include: collection name, total supply, rarity tiers (5 levels), trait categories (minimum 8), character/item descriptions for each tier, lore/backstory, utility features, and metadata JSON structure. Style: [ART_STYLE]. Ensure each tier has distinct visual characteristics.",
    exampleOutput: "A complete NFT collection brief with rarity distribution, trait matrix, and lore document.",
    author: "0x5555...7777",
    authorName: "NFTArtist",
    likes: 67,
    mints: 31,
    createdAt: Date.now() - 43200000,
  },
  {
    id: "5",
    title: "Tokenomics Model Designer",
    description: "Design sustainable tokenomics models for Web3 projects",
    category: "business",
    prompt: "Design a tokenomics model for [PROJECT_NAME] in the [SECTOR] sector. Total supply: [SUPPLY]. Include: token utility (minimum 5 use cases), distribution schedule (4-year vesting), emission curve, staking mechanics, governance weight allocation, treasury management, and buyback/burn mechanism. Ensure alignment between token value accrual and protocol revenue.",
    exampleOutput: "A complete tokenomics whitepaper section with distribution charts, vesting schedules, and economic simulations.",
    author: "0x3333...4444",
    authorName: "TokenomicsPro",
    likes: 45,
    mints: 19,
    createdAt: Date.now() - 21600000,
  },
  {
    id: "6",
    title: "Smart Contract Security Auditor",
    description: "Comprehensive security audit checklist for smart contracts",
    category: "education",
    prompt: "Create a comprehensive security audit checklist for a [CONTRACT_TYPE] smart contract. Cover: access control patterns, reentrancy vectors, integer overflow/underflow, front-running vulnerabilities, flash loan attack surfaces, oracle manipulation risks, and gas limit issues. For each vulnerability, provide: description, detection method, severity rating, and fix recommendation.",
    exampleOutput: "A detailed security audit report template with vulnerability categories, detection scripts, and remediation guides.",
    author: "0x8888...9999",
    authorName: "SecurityAuditor",
    likes: 73,
    mints: 28,
    createdAt: Date.now() - 10800000,
  },
];
