import { NextResponse } from "next/server";
import { PROMPT_TEMPLATES } from "@/lib/prompts";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { input, category = "code", systemPrompt, isTest } = body;

    if (!input) {
      return NextResponse.json(
        { error: "Input is required" },
        { status: 400 }
      );
    }

    // Get the template for this category
    const template = PROMPT_TEMPLATES[category] || PROMPT_TEMPLATES.code;

    // In production, this would call Ritual's LLM precompile (0x0802)
    // via a backend signer. For this demo, we simulate the output.
    // To integrate with real Ritual LLM:
    // 1. Deploy a consumer contract that calls 0x0802
    // 2. Use viem to encode the precompile call
    // 3. Send tx via a backend private key
    // 4. Parse the settled output from spcCalls

    if (isTest) {
      // Test mode: simulate LLM output using the provided systemPrompt
      const simulatedOutput = generateSimulatedOutput(
        systemPrompt || template.systemPrompt,
        input
      );
      return NextResponse.json({ prompt: simulatedOutput });
    }

    // Generate mode: create optimized prompt
    const optimizedPrompt = generateOptimizedPrompt(template, input);

    return NextResponse.json({ prompt: optimizedPrompt });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate prompt" },
      { status: 500 }
    );
  }
}

function generateOptimizedPrompt(
  template: { systemPrompt: string; userTemplate: string; category: string },
  input: string
): string {
  // Simulate what the LLM precompile would return
  // In production, this is the actual LLM output from Ritual Chain
  const categorySpecific = getCategorySpecificPrompt(template.category, input);

  return categorySpecific;
}

function getCategorySpecificPrompt(category: string, input: string): string {
  const prompts: Record<string, string> = {
    code: `[Optimized Code Generation Prompt]

You are an expert software engineer. Generate production-ready code for the following requirement:

**Requirement:** ${input}

**Constraints:**
- Language: TypeScript/JavaScript (unless otherwise specified)
- Follow best practices and design patterns
- Include comprehensive error handling
- Add inline comments for complex logic
- Provide TypeScript types where applicable
- Include a brief usage example

**Output Format:**
1. Complete, runnable code
2. Brief explanation of key decisions
3. Usage example with expected output
4. Potential improvements or alternatives

**Quality Checklist:**
- [ ] Handles edge cases
- [ ] Proper error boundaries
- [ ] Type-safe
- [ ] Well-documented
- [ ] Performant`,

    writing: `[Optimized Writing Prompt]

You are a skilled content writer. Create compelling content for the following topic:

**Topic:** ${input}

**Style Guidelines:**
- Tone: Professional yet engaging
- Voice: Active voice preferred
- Structure: Clear headings, short paragraphs
- Length: 800-1200 words

**Content Requirements:**
1. Hook introduction that captures attention
2. Clear thesis or main argument
3. Supporting evidence or examples
4. Smooth transitions between sections
5. Strong conclusion with call-to-action

**SEO Considerations:**
- Include relevant keywords naturally
- Use descriptive headings (H2, H3)
- Add meta description suggestion
- Include internal/external link suggestions`,

    analysis: `[Optimized Analysis Prompt]

You are a strategic analyst. Provide comprehensive analysis for:

**Subject:** ${input}

**Analysis Framework:**
1. **Executive Summary** (2-3 sentences)
2. **Current State Assessment**
   - Key metrics and trends
   - Competitive positioning
   - Strengths and weaknesses
3. **Opportunity Analysis**
   - Market gaps
   - Growth potential
   - Risk factors
4. **Strategic Recommendations**
   - Short-term actions (0-3 months)
   - Medium-term initiatives (3-12 months)
   - Long-term vision (1-3 years)
5. **Implementation Roadmap**
   - Priority actions
   - Resource requirements
   - Success metrics

**Data Sources to Consider:**
- Industry reports
- Market data
- Competitor analysis
- User feedback`,

    creative: `[Optimized Creative Prompt]

You are a creative visionary. Develop a creative concept for:

**Concept:** ${input}

**Creative Brief:**
1. **Core Concept** - The central idea in one sentence
2. **Mood & Atmosphere** - Emotional tone and visual style
3. **Key Elements** - Essential components and motifs
4. **Narrative Arc** - Story structure or creative flow
5. **Innovation Angle** - What makes this unique

**Creative Constraints:**
- Push boundaries while staying accessible
- Balance originality with familiarity
- Consider multi-platform adaptation
- Include sensory details and imagery

**Deliverables:**
- Concept document (500 words)
- Mood board description
- Key visual/creative elements list
- Adaptation suggestions for different formats`,

    business: `[Optimized Business Strategy Prompt]

You are a business strategist. Develop a comprehensive strategy for:

**Business Objective:** ${input}

**Strategic Framework:**
1. **Market Analysis**
   - Market size and growth trends
   - Target customer segments
   - Competitive landscape
   - Regulatory environment

2. **Value Proposition**
   - Core value drivers
   - Differentiation strategy
   - Pricing model considerations
   - Customer acquisition channels

3. **Operational Plan**
   - Key capabilities required
   - Resource allocation
   - Partnership opportunities
   - Technology stack

4. **Financial Projections**
   - Revenue model
   - Cost structure
   - Break-even analysis
   - Funding requirements

5. **Risk Assessment**
   - Market risks
   - Operational risks
   - Financial risks
   - Mitigation strategies

**Success Metrics:**
- KPI targets for 6, 12, and 24 months
- Milestone checkpoints
- Review cadence`,

    education: `[Optimized Educational Prompt]

You are an expert educator. Design learning content for:

**Learning Objective:** ${input}

**Educational Design:**
1. **Learning Outcomes**
   - What learners will know
   - What learners will be able to do
   - Assessment criteria

2. **Content Structure**
   - Prerequisites and prior knowledge
   - Module breakdown (3-5 modules)
   - Key concepts per module
   - Practical exercises

3. **Teaching Methodology**
   - Primary approach (lecture, hands-on, discussion)
   - Engagement techniques
   - Differentiation strategies
   - Accessibility considerations

4. **Assessment Plan**
   - Formative assessments
   - Summative assessments
   - Rubrics and criteria
   - Feedback mechanisms

5. **Resources Required**
   - Materials and tools
   - Time estimates
   - Technology needs
   - Support resources

**Engagement Features:**
- Interactive elements
- Real-world applications
- Collaborative activities
- Progress tracking`,
  };

  return prompts[category] || prompts.code;
}

function generateSimulatedOutput(systemPrompt: string, input: string): string {
  // Simulate LLM test output
  return `[Test Output - Ritual LLM Simulation]

Input: ${input}

System Context: ${systemPrompt.slice(0, 100)}...

---

Based on the provided prompt, here is a sample output:

The ${input} topic requires careful consideration of multiple factors.
Key aspects include:

1. **Technical Foundation** - Ensuring robust architecture
2. **User Experience** - Intuitive and accessible design
3. **Scalability** - Planning for growth and expansion
4. **Security** - Implementing best practices

This is a simulated output. In production, this would be generated by
Ritual's LLM precompile (0x0802) using the GLM-4.7-FP8 model running
inside a TEE (Trusted Execution Environment).

The actual on-chain call would:
1. Encode the prompt using the 30-field ABI tuple
2. Submit to TEE executor via RitualChain
3. Receive settled output in spcCalls
4. Decode completion_data from the receipt`;
}
