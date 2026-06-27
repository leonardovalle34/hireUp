import { serve } from 'https://deno.land/std/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import OpenAI from 'https://esm.sh/openai';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const MAX_TURNS = 8;
const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

function buildSystemPrompt(area: string, turn: number): string {
  return `You are Ace, a friendly and professional male interviewer conducting a job interview in English.
The candidate is applying for a position in the ${area} field.

${turn === 1 ? 'This is the FIRST question. Start by asking: "Tell me about yourself and what specific role you\'re interviewing for today?"' : ''}

Rules:
- Ask ONE question at a time
- Base your next question on the candidate\'s previous answer
- Mix technical and behavioral questions naturally
- Be professional but encouraging and warm
- Keep questions concise (1-2 sentences max)
- Do NOT give feedback during the interview
- Respond ONLY with your next question, nothing else`;
}

function buildFeedbackPrompt(area: string, history: any[]): string {
  const conversation = history
    .map((h, i) => `Q${i + 1}: ${h.question}\nA${i + 1}: ${h.answer || '(no answer)'}`)
    .join('\n\n');

  return `You are an encouraging English interview coach evaluating a Brazilian professional practicing English.

Important context:
- This person is a non-native English speaker practicing for professional interviews
- Score generously — a score below 10 should be rare and only for very poor performance
- Most candidates who make reasonable effort should score between 12-17
- Focus on encouragement and growth, not perfection
- Even basic answers in English deserve recognition

Interview area: ${area}

Full conversation:
${conversation}

Scoring guide:
- 16-20: Excellent English, clear and confident answers
- 12-15: Good English, answers the questions well with minor issues
- 8-11: Adequate English, communicates the main ideas despite some errors
- 4-7: Basic English, struggles but tries — rare
- 0-3: Almost no English — very rare

Respond ONLY with a raw JSON object. No markdown, no code fences, no text before or after. Just valid JSON.

Format exactly: { "score": number between 0 and 20, "strengths": ["strength 1", "strength 2", "strength 3"], "improvements": ["improvement 1", "improvement 2"], "recommendation": "encouraging next steps", "summary": "warm encouraging overall summary" }`;
}

function isOpenAIModel(model: string): boolean {
  return model.startsWith('gpt') || model.startsWith('o1');
}

function isCustomClaudeModel(model: string): boolean {
  return !isOpenAIModel(model) && model !== DEFAULT_MODEL;
}

function resolveKeys(model: string, userApiKey: string | null): { anthropicKey: string; openaiKey: string } {
  const isOpenAI = isOpenAIModel(model);
  const isCustomClaude = isCustomClaudeModel(model);

  if (isOpenAI) {
    if (!userApiKey) throw new Error('API key OpenAI é necessária para usar este modelo. Adicione em Configurações → API Key própria.');
    return {
      openaiKey: userApiKey,
      anthropicKey: Deno.env.get('ANTHROPIC_API_KEY')!,
    };
  }

  if (isCustomClaude) {
    if (!userApiKey) throw new Error('API key Anthropic é necessária para usar este modelo. Adicione em Configurações → API Key própria.');
    return {
      openaiKey: Deno.env.get('OPENAI_API_KEY')!,
      anthropicKey: userApiKey,
    };
  }

  return {
    openaiKey: Deno.env.get('OPENAI_API_KEY')!,
    anthropicKey: Deno.env.get('ANTHROPIC_API_KEY')!,
  };
}

async function generateQuestion(
  messages: any[],
  systemPrompt: string,
  model: string,
  anthropicKey: string,
  openaiKey: string,
): Promise<string> {
  if (isOpenAIModel(model)) {
    const openai = new OpenAI({ apiKey: openaiKey });
    const response = await openai.chat.completions.create({
      model,
      max_tokens: 150,
      messages: [
        { role: 'system', content: systemPrompt },
        ...messages.map((m: any) => ({ role: m.role, content: m.content })),
      ],
    });
    return response.choices[0]?.message?.content?.trim() || '';
  } else {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const response = await anthropic.messages.create({
      model,
      max_tokens: 150,
      system: systemPrompt,
      messages,
    });
    return response.content[0].type === 'text' ? response.content[0].text.trim() : '';
  }
}

async function generateFeedback(
  feedbackPrompt: string,
  model: string,
  anthropicKey: string,
  openaiKey: string,
): Promise<string> {
  if (isOpenAIModel(model)) {
    const openai = new OpenAI({ apiKey: openaiKey });
    const response = await openai.chat.completions.create({
      model,
      max_tokens: 1000,
      messages: [{ role: 'user', content: feedbackPrompt }],
    });
    return response.choices[0]?.message?.content?.trim() || '{}';
  } else {
    const anthropic = new Anthropic({ apiKey: anthropicKey });
    const response = await anthropic.messages.create({
      model,
      max_tokens: 1000,
      messages: [{ role: 'user', content: feedbackPrompt }],
    });
    return response.content[0].type === 'text' ? response.content[0].text.trim() : '{}';
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const area = (formData.get('area') as string) || 'technology';
    const turn = parseInt((formData.get('turn') as string) || '1');
    const historyRaw = (formData.get('history') as string) || '[]';
    const userApiKey = formData.get('userApiKey') as string | null;
    const userModel = formData.get('userModel') as string | null;

    // Busca plano
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const plan = profile?.plan || 'free';

    // Free não pode usar API key própria
    if (plan === 'free' && userApiKey) {
      return new Response(JSON.stringify({ error: 'API key própria não está disponível no plano Free.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const history: { question: string; answer: string }[] = JSON.parse(historyRaw);

    const model = userModel || DEFAULT_MODEL;
    const { anthropicKey, openaiKey } = resolveKeys(model, userApiKey);
    const whisperKey = Deno.env.get('OPENAI_API_KEY')!;

    // Transcrição via Whisper
    let transcription = '';
    if (file) {
      const openai = new OpenAI({ apiKey: whisperKey });
      const mimeType = file.type || 'audio/webm';
      let extension = 'webm';
      if (mimeType.includes('mp4') || mimeType.includes('m4a') || mimeType.includes('aac')) extension = 'mp4';
      else if (mimeType.includes('ogg')) extension = 'ogg';
      else if (mimeType.includes('wav')) extension = 'wav';
      else if (mimeType.includes('mpeg') || mimeType.includes('mp3')) extension = 'mp3';

      const audioFile = new File([file], `recording.${extension}`, { type: mimeType });
      const result = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'gpt-4o-transcribe',
      });
      transcription = result.text;
    }

    const updatedHistory = [...history];
    if (transcription && updatedHistory.length > 0) {
      updatedHistory[updatedHistory.length - 1] = {
        ...updatedHistory[updatedHistory.length - 1],
        answer: transcription,
      };
    }

    const isFinished = turn >= MAX_TURNS;

    if (isFinished) {
      const rawText = await generateFeedback(
        buildFeedbackPrompt(area, updatedHistory),
        model, anthropicKey, openaiKey,
      );

      const clean = rawText
        .replace(/^```json\s*/gi, '')
        .replace(/^```\s*/gi, '')
        .replace(/\s*```$/gi, '')
        .trim();

      let feedback;
      try {
        feedback = JSON.parse(clean);
      } catch {
        feedback = { score: 12, summary: rawText, strengths: [], improvements: [], recommendation: '' };
      }

      if (typeof feedback.score !== 'number' || feedback.score < 0 || feedback.score > 20) {
        feedback.score = 12;
      }

      await supabase.from('lesson_sessions').insert({
        user_id: user.id,
        score: feedback.score,
      });

      return new Response(JSON.stringify({
        transcription,
        next_question: null,
        is_finished: true,
        feedback,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const messages: any[] = [];
    for (const h of updatedHistory) {
      if (h.question) messages.push({ role: 'assistant', content: h.question });
      if (h.answer) messages.push({ role: 'user', content: h.answer });
    }
    if (messages.length === 0) {
      messages.push({ role: 'user', content: 'Start the interview.' });
    }

    const nextQuestion = await generateQuestion(
      messages,
      buildSystemPrompt(area, turn),
      model, anthropicKey, openaiKey,
    );

    return new Response(JSON.stringify({
      transcription,
      next_question: nextQuestion,
      is_finished: false,
      feedback: null,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err: any) {
    console.error('Interview function error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});