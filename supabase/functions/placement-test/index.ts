import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

const QUIZ_ANSWERS: Record<number, { correct: string; explanation: string }> = {
  0: { correct: 'A', explanation: '"Goes" is the correct 3rd-person singular present tense.' },
  1: { correct: 'B', explanation: '"Were" is the past continuous form used with "they".' },
  2: { correct: 'C', explanation: '"Had" is used in the 2nd conditional (unreal present).' },
  3: { correct: 'B', explanation: '"On schedule" means as planned — a fixed expression.' },
  4: { correct: 'B', explanation: 'Adverbs modify verbs. "Fluently" is the adverb of "fluent".' },
};

const PRONUNCIATION_PHRASES = [
  'The presentation went really well today.',
  'I would like to schedule a meeting for next week.',
  'Our team delivered excellent results this quarter.',
];

const INTERPRETATION_TEXT =
  'Remote work has become increasingly popular in recent years. Many companies now offer flexible arrangements that allow employees to work from home. While this has improved work-life balance for many workers, it has also created new challenges in team collaboration and communication.';

const INTERPRETATION_QUESTIONS = [
  'What is the main benefit of remote work mentioned in the text?',
  'What challenge does remote work create, according to the text?',
];

async function transcribeAudio(audioFile: File, openaiKey: string): Promise<string> {
  const form = new FormData();
  form.append('file', audioFile);
  form.append('model', 'whisper-1');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Erro na transcrição de áudio');
  }

  const data = await res.json();
  return data.text?.trim() || '';
}

async function scoreWithClaude(
  anthropic: Anthropic,
  model: string,
  prompt: string,
): Promise<{ score: number; feedback: string }> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: 200,
    messages: [{ role: 'user', content: prompt }],
  });

  const contentBlock = response.content?.[0] as { type: string; text: string } | undefined;
  const text = contentBlock?.text;
  if (!text) return { score: 50, feedback: '' };
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {}
  }
  return { score: 50, feedback: text };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const stage = formData.get('stage') as string;
    const questionIndex = parseInt((formData.get('question_index') as string) || '0');
    const answer = formData.get('answer') as string | null;
    const historyRaw = (formData.get('history') as string) || '[]';
    const scoresRaw = (formData.get('scores') as string) || '{}';
    const userApiKey = formData.get('userApiKey') as string | null;
    const userModel = (formData.get('userModel') as string) || DEFAULT_MODEL;
    const audioFile = formData.get('file') as File | null;

    const history: { role: string; content: string }[] = JSON.parse(historyRaw);
    const scores: Record<string, number> = JSON.parse(scoresRaw);

    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    const apiKey = userApiKey || Deno.env.get('ANTHROPIC_API_KEY')!;
    const anthropic = new Anthropic({ apiKey });

    // ── QUIZ ──────────────────────────────────────────────────────────────────
    if (stage === 'quiz') {
      const qa = QUIZ_ANSWERS[questionIndex];
      if (!qa) throw new Error('Questão inválida');

      const isCorrect = answer?.toUpperCase() === qa.correct;

      return new Response(
        JSON.stringify({
          correct: isCorrect,
          correct_answer: qa.correct,
          explanation: qa.explanation,
          score: isCorrect ? 100 : 0,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── PRONUNCIATION ─────────────────────────────────────────────────────────
    if (stage === 'pronunciation') {
      if (!audioFile || audioFile.size === 0) throw new Error('Áudio necessário');

      const phrase = PRONUNCIATION_PHRASES[questionIndex];
      if (!phrase) throw new Error('Frase inválida');

      const transcription = await transcribeAudio(audioFile, openaiKey);

      if (!transcription || transcription.length < 2) {
        return new Response(JSON.stringify({
          error: 'Não conseguimos identificar sua resposta no áudio. Por favor, tente gravar novamente falando mais alto e claramente.',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const prompt = `You are evaluating English pronunciation for a placement test.
Target phrase: "${phrase}"
Transcribed speech: "${transcription}"

Evaluate pronunciation accuracy (did they say the right words?) and naturalness.
Respond in JSON only: {"score": <0-100>, "feedback": "<1-2 sentences in Portuguese, encouraging tone>"}`;

      let evaluation;
      try {
        evaluation = await scoreWithClaude(anthropic, userModel, prompt);
      } catch (err) {
        console.error('Erro ao processar resposta da IA:', err);
        return new Response(JSON.stringify({
          error: 'Houve um problema ao processar sua resposta. Por favor, tente novamente.',
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ transcription, phrase, ...evaluation }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── INTERPRETATION ────────────────────────────────────────────────────────
    if (stage === 'interpretation') {
      if (!audioFile || audioFile.size === 0) throw new Error('Áudio necessário');

      const question = INTERPRETATION_QUESTIONS[questionIndex];
      if (!question) throw new Error('Pergunta inválida');

      const transcription = await transcribeAudio(audioFile, openaiKey);

      if (!transcription || transcription.length < 2) {
        return new Response(JSON.stringify({
          error: 'Não conseguimos identificar sua resposta no áudio. Por favor, tente gravar novamente falando mais alto e claramente.',
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const prompt = `You are evaluating English reading comprehension for a placement test.

Text: "${INTERPRETATION_TEXT}"
Question: "${question}"
Student answer (transcribed): "${transcription}"

Evaluate: (1) did they understand the text? (2) how fluent is their English?
Respond in JSON only: {"score": <0-100>, "feedback": "<1-2 sentences in Portuguese, encouraging tone>"}`;

      let evaluation;
      try {
        evaluation = await scoreWithClaude(anthropic, userModel, prompt);
      } catch (err) {
        console.error('Erro ao processar resposta da IA:', err);
        return new Response(JSON.stringify({
          error: 'Houve um problema ao processar sua resposta. Por favor, tente novamente.',
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(
        JSON.stringify({ transcription, ...evaluation }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── CONVERSATION ──────────────────────────────────────────────────────────
    if (stage === 'conversation') {
      let transcription = '';

      if (audioFile && audioFile.size > 0) {
        transcription = await transcribeAudio(audioFile, openaiKey);
        if (!transcription || transcription.length < 2) {
          return new Response(JSON.stringify({
            error: 'Não conseguimos identificar sua resposta no áudio. Por favor, tente gravar novamente falando mais alto e claramente.',
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else if (answer) {
        transcription = answer;
      }

      const messages: { role: 'user' | 'assistant'; content: string }[] = history.map(
        (h) => ({ role: h.role as 'user' | 'assistant', content: h.content }),
      );

      if (transcription) {
        messages.push({ role: 'user', content: transcription });
      } else if (messages.length === 0) {
        messages.push({ role: 'user', content: '[START]' });
      }

      const systemPrompt = `You are Ace, a friendly English evaluator conducting a placement test conversation.
Have a natural professional conversation in English. Ask about work experience, goals, or interests.
Keep responses to 2 sentences + 1 follow-up question. This is turn ${questionIndex + 1} of 3.
Be encouraging and professional.`;

      let chatResponse;
      try {
        chatResponse = await anthropic.messages.create({
          model: userModel,
          max_tokens: 200,
          system: systemPrompt,
          messages,
        });
      } catch (err) {
        console.error('Erro ao processar resposta da IA:', err);
        return new Response(JSON.stringify({
          error: 'Houve um problema ao processar sua resposta. Por favor, tente novamente.',
        }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const aiResponseBlock = chatResponse.content?.[0] as { type: string; text: string } | undefined;
      const aiResponse = aiResponseBlock?.text ?? '';

      let score = 0;
      let feedback = '';
      if (transcription && transcription !== '[START]') {
        const evalPrompt = `Rate this English response for a placement test (fluency, vocabulary, grammar):
"${transcription}"
Respond in JSON only: {"score": <0-100>, "feedback": "<1 sentence in Portuguese>"}`;
        try {
          const evaluation = await scoreWithClaude(anthropic, userModel, evalPrompt);
          score = evaluation.score;
          feedback = evaluation.feedback;
        } catch (err) {
          console.error('Erro ao processar resposta da IA:', err);
        }
      }

      const updatedHistory = [...history];
      if (transcription && transcription !== '[START]') {
        updatedHistory.push({ role: 'user', content: transcription });
      }
      updatedHistory.push({ role: 'assistant', content: aiResponse });

      return new Response(
        JSON.stringify({ transcription, ai_response: aiResponse, score, feedback, history: updatedHistory }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // ── RESULT ────────────────────────────────────────────────────────────────
    if (stage === 'result') {
      const quizScore = scores.quiz ?? 0;
      const pronScore = scores.pronunciation ?? 0;
      const interpScore = scores.interpretation ?? 0;
      const convScore = scores.conversation ?? 0;

      const finalScore =
        quizScore * 0.3 + pronScore * 0.2 + interpScore * 0.25 + convScore * 0.25;

      let level: string;
      if (finalScore >= 76) level = 'advanced';
      else if (finalScore >= 56) level = 'intermediate';
      else if (finalScore >= 36) level = 'elementary';
      else level = 'beginner';

      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      );

      const jwt = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabaseClient.auth.getUser(jwt);

      if (user) {
        const levelOrder = ['beginner', 'elementary', 'intermediate', 'advanced', 'business'];

        const { data: currentProfile } = await supabaseClient
          .from('profiles')
          .select('english_level')
          .eq('id', user.id)
          .single();

        const currentLevel = currentProfile?.english_level || 'beginner';
        const currentIndex = levelOrder.indexOf(currentLevel);
        const testResultIndex = levelOrder.indexOf(level);

        const finalLevel = testResultIndex >= currentIndex ? level : currentLevel;

        await supabaseClient
          .from('profiles')
          .update({
            english_level: finalLevel,
            placement_test_done: true,
            placement_test_done_at: new Date().toISOString(),
          })
          .eq('id', user.id);
      }

      const levelLabels: Record<string, string> = {
        beginner: 'Iniciante',
        elementary: 'Básico',
        intermediate: 'Intermediário',
        advanced: 'Avançado',
      };

      return new Response(
        JSON.stringify({
          level,
          level_label: levelLabels[level],
          final_score: Math.round(finalScore),
          breakdown: {
            quiz: Math.round(quizScore),
            pronunciation: Math.round(pronScore),
            interpretation: Math.round(interpScore),
            conversation: Math.round(convScore),
          },
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    throw new Error(`Stage inválido: ${stage}`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
