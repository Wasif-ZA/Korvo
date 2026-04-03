import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db/prisma";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function deriveTone(score: number): "direct" | "curious" | "value_driven" {
  if (score >= 75) return "direct";
  if (score >= 45) return "curious";
  return "value_driven";
}

function getToneInstruction(
  tone: "direct" | "curious" | "value_driven",
): string {
  if (tone === "direct") {
    return "Write with a direct, confident tone. Get straight to the point. Be clear about what you want and why you are reaching out.";
  }
  if (tone === "curious") {
    return "Write with a curious, genuine tone. Show authentic interest in their work. Ask one thoughtful question.";
  }
  return "Write with a value-driven tone. Lead with what you can offer or contribute. Focus on how you can help them, not what you want.";
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Look up the outreach record with its parent contact and search
  let outreach;
  try {
    outreach = await prisma.outreach.findUniqueOrThrow({
      where: { id },
      include: {
        contact: {
          include: {
            search: true,
          },
        },
      },
    });
  } catch {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  // Ownership check
  if (outreach.contact.search.userId !== user.id) {
    return NextResponse.json({ error: "Draft not found" }, { status: 404 });
  }

  const contact = outreach.contact;
  const search = contact.search;
  const score = contact.score ?? 0;
  const tone = deriveTone(score);
  const toneInstruction = getToneInstruction(tone);
  const hook = contact.researchMentionThis ?? contact.researchAskThis ?? "";

  // Generate a new draft via Claude Haiku 4.5
  const systemPrompt = `You are a cold email expert helping job seekers write personalized outreach emails. Write concise, authentic cold emails that get responses. Never write generic emails. Always personalize based on the contact's background and the hook provided. Keep emails under 150 words.`;

  const userMessage = `Write a cold email from a job seeker to ${contact.name}, ${contact.title} at ${search.company}.

Role being targeted: ${search.role}
${hook ? `Personalization hook to use: ${hook}` : ""}
Tone instruction: ${toneInstruction}

Return ONLY a JSON object with exactly these two fields:
{
  "subject": "<compelling subject line under 8 words>",
  "body": "<4-sentence cold email body, no greeting or sign-off>"
}`;

  let newSubject: string;
  let newBody: string;

  try {
    const message = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const parsed = JSON.parse(jsonMatch[0]) as {
      subject: string;
      body: string;
    };

    if (!parsed.subject || !parsed.body) {
      throw new Error("Invalid AI response structure");
    }

    newSubject = parsed.subject;
    newBody = parsed.body;
  } catch {
    return NextResponse.json(
      { error: "Failed to regenerate draft" },
      { status: 500 },
    );
  }

  // Persist the new draft to the database
  const updated = await prisma.outreach.update({
    where: { id },
    data: {
      subject: newSubject,
      body: newBody,
      tone,
    },
  });

  return NextResponse.json({
    success: true,
    data: {
      id: updated.id,
      subject: updated.subject,
      body: updated.body,
      hook_used: hook,
    },
  });
}
