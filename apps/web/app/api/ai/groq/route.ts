import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions';

async function callGroqChat(messages: Array<{ role: string; content: string }>, jsonMode = true) {
  const models = ['openai/gpt-oss-120b', 'qwen/qwen3.8-27b'];
  let lastError = null;

  for (const model of models) {
    try {
      const payload: Record<string, any> = {
        model,
        messages,
        temperature: 0.3,
      };

      if (jsonMode) {
        payload.response_format = { type: 'json_object' };
      }

      const res = await fetch(GROQ_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.warn(`Groq model ${model} failed with status ${res.status}: ${errorText}`);
        lastError = new Error(`Groq ${res.status}: ${errorText}`);
        continue;
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        return content;
      }
    } catch (err: any) {
      console.warn(`Error invoking Groq model ${model}:`, err.message);
      lastError = err;
    }
  }

  throw lastError || new Error('All Groq models failed');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'find') {
      const { query, events = [] } = body;
      if (!query) {
        return NextResponse.json({ error: 'Query is required' }, { status: 400 });
      }

      // Catalog overview for Groq
      const catalog = events.slice(0, 15).map((e: any) => ({
        id: e.id,
        slug: e.slug,
        title: e.title,
        description: e.description ? e.description.slice(0, 160) : '',
        tags: e.tags || [],
        mode: e.mode || e.eventType || 'ONLINE',
        location: e.location || 'Online',
        prize: e.prize || '',
        category: e.category || 'HACKATHON',
      }));

      const systemPrompt = `You are the AI Search & Discovery Engine for Hacker's Unity hackathon platform.
Analyze the user query and match the most relevant hackathons from the provided catalog.
Return valid JSON in this exact structure:
{
  "matchedEventIds": ["id1", "id2"],
  "rationale": "One crisp sentence explaining why these events match the user's intent.",
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`;

      const userPrompt = `User Query: "${query}"\n\nEvents Catalog:\n${JSON.stringify(catalog, null, 2)}`;

      const responseText = await callGroqChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      const parsed = JSON.parse(responseText);
      return NextResponse.json({
        success: true,
        matchedEventIds: parsed.matchedEventIds || [],
        rationale: parsed.rationale || '',
        suggestedTags: parsed.suggestedTags || [],
      });
    }

    if (action === 'build') {
      const { prompt, sourceText = '', imageBase64 } = body;
      if (!prompt && !sourceText && !imageBase64) {
        return NextResponse.json(
          { error: 'Either prompt, brochure document, or hackathon poster image is required' },
          { status: 400 }
        );
      }

      // Native Multimodal Vision Poster Analysis via Groq
      let extractedPosterText = '';
      if (imageBase64) {
        try {
          const imgUrl = imageBase64.startsWith('data:')
            ? imageBase64
            : `data:image/jpeg;base64,${imageBase64}`;

          const visionRes = await fetch(GROQ_URL, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              'Content-Type': 'application/json',
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
            },
            body: JSON.stringify({
              model: 'qwen/qwen3.8-27b',
              max_tokens: 600,
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: 'Analyze this hackathon / event poster thoroughly. Transcribe and extract all visible details: hackathon title, subtitle/tagline, organizing institution/college/brand, venue or city/mode, event dates, registration deadline, total prize pool & cash amounts, tracks/themes, team size, eligibility, and rules.',
                    },
                    {
                      type: 'image_url',
                      image_url: { url: imgUrl },
                    },
                  ],
                },
              ],
            }),
          });

          if (visionRes.ok) {
            const visionData = await visionRes.json();
            extractedPosterText = visionData.choices?.[0]?.message?.content || '';
          } else {
            console.warn('Groq vision endpoint status:', visionRes.status, await visionRes.text());
          }
        } catch (visionErr: any) {
          console.warn('Poster vision analysis warning:', visionErr.message);
        }
      }

      const now = new Date();
      const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const regStartStr = now.toISOString().split('T')[0];
      const regDeadlineStr = new Date(nextMonth.getTime() - 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const eventStartStr = nextMonth.toISOString().split('T')[0];
      const eventEndStr = new Date(nextMonth.getTime() + 2 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const systemPrompt = `You are the AI Event Architect for Hacker's Unity (India's premier hackathon platform).
Your task is to transform natural language instructions, event brochures, or hackathon poster/banner OCR text into a complete, professional, production-ready Hackathon specification.

Rules:
1. If text extracted from a hackathon poster is provided, carefully read every detail (hackathon title, organizing college/brand, dates, prize pool, tracks/themes, team size, venue/city) and map them accurately.
2. If location or city is mentioned (e.g. Bangalore, Delhi, Jaipur, Pune, Mumbai, Hyderabad), set eventType to 'OFFLINE' or 'HYBRID'. Otherwise default to 'ONLINE'.
3. Category must be one of: 'HACKATHON', 'HIRING_CHALLENGE', 'TECH_EVENT', 'CONFERENCE'.
4. EventType must be one of: 'ONLINE', 'OFFLINE', 'HYBRID'.
5. Dates should be in YYYY-MM-DD format (upcoming dates relative to today: ${regStartStr}).
6. Generate rich markdown in description (including # Overview, ## Problem Statements / Tracks, ## Submission Guidelines, ## Judging Criteria).
7. Return strictly valid JSON conforming to this schema:
{
  "title": "Clear, memorable hackathon title",
  "tagline": "A punchy, inspiring 1-sentence tagline",
  "institutionName": "University / College or Organization Name",
  "organizerLeadName": "Community Lead or Organizing Team",
  "organizerName": "University or Community Name",
  "category": "HACKATHON",
  "eventType": "ONLINE",
  "mode": "Online",
  "location": "Online / Discord",
  "description": "# Overview\\nDetailed markdown...",
  "rulesText": "1. All code must be written during the hackathon.\\n2. Open source libraries are allowed.\\n3. Teams must submit a working GitHub repo and demo video.",
  "prize": "₹1,00,000",
  "totalPrizeValue": 100000,
  "currency": "INR",
  "prizes": [
    { "position": "1st Place (Grand Winner)", "amount": 50000, "description": "Cash prize + incubator fast-track" },
    { "position": "2nd Place (Runner Up)", "amount": 30000, "description": "Cash prize + developer grant" },
    { "position": "3rd Place (2nd Runner Up)", "amount": 20000, "description": "Cash prize + cloud credits" }
  ],
  "tracks": [
    { "title": "Track Name 1", "prize": "₹25,000", "description": "Problem statement and deliverables" },
    { "title": "Track Name 2", "prize": "₹25,000", "description": "Problem statement and deliverables" }
  ],
  "registrationStart": "${regStartStr}",
  "registrationDeadline": "${regDeadlineStr}",
  "startDate": "${eventStartStr}",
  "endDate": "${eventEndStr}",
  "minTeamSize": 1,
  "maxTeamSize": 4,
  "difficulty": "All Levels Welcome",
  "eligibility": "Open to college students, developers, and builders worldwide",
  "tags": ["AI", "Web3", "Fullstack"]
}`;

      const userPrompt = `User Prompt: ${prompt || 'Create and configure the hackathon based on this poster/brochure'}
${extractedPosterText ? `\n--- TEXT EXTRACTED FROM HACKATHON POSTER (OCR) ---\n${extractedPosterText}\n-------------------------------------------------` : ''}
${sourceText ? `\n--- ATTACHED DOCUMENT CONTENT ---\n${sourceText}\n--------------------------------` : ''}`;

      const responseText = await callGroqChat([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ]);

      const eventData = JSON.parse(responseText);

      return NextResponse.json({
        success: true,
        event: eventData,
        extractedPosterText: extractedPosterText || undefined,
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Groq AI API Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal AI service error' },
      { status: 500 }
    );
  }
}
