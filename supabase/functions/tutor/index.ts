import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const TUTORS: Record<string, { name: string }> = {
  beginner: { name: 'Ana' },
  elementary: { name: 'Carlos' },
  intermediate: { name: 'James' },
  advanced: { name: 'Sarah' },
};

function buildSystemPrompt(level: string, mode: string, topic: string): string {
  const tutor = TUTORS[level] || TUTORS.beginner;

  const personalities: Record<string, string> = {
    beginner: `Você é ${tutor.name}, uma tutora de inglês gentil e paciente para iniciantes.
Fale principalmente em PORTUGUÊS. Introduza palavras e frases simples em inglês com tradução imediata.
Seja encorajadora, celebre cada progresso. Use linguagem simples e clara.
Corrija erros delicadamente, reescrevendo a frase correta de forma natural.`,

    elementary: `Você é ${tutor.name}, um tutor de inglês amigável para alunos elementares.
Misture PORTUGUÊS e INGLÊS (60% português, 40% inglês).
Para palavras novas em inglês, inclua a tradução entre parênteses.
Incentive o aluno a tentar usar mais inglês. Corrija erros com gentileza.`,

    intermediate: `You are ${tutor.name}, an engaging English tutor for intermediate learners.
Speak MOSTLY IN ENGLISH (80% English). Use Portuguese only to clarify complex concepts.
Use clear, natural English. Correct mistakes diplomatically by naturally rephrasing correctly.
Encourage the student to express themselves fully in English.`,

    advanced: `You are ${tutor.name}, a sophisticated English tutor for advanced learners.
Speak ONLY IN ENGLISH. Use rich vocabulary, idioms, and natural expressions.
Challenge the student with precise, professional language. Point out subtle nuances.
Discuss topics at an elevated level and push for accuracy and fluency.`,
  };

  const personality = personalities[level] || personalities.beginner;

  const modeInstruction =
    mode === 'lesson' && topic
      ? `\n\nMODO: Lição estruturada sobre "${topic}".
Conduza uma aula focada: apresente o conceito, dê exemplos, faça perguntas práticas.
Progrida gradualmente do básico ao mais elaborado dentro do tópico.`
      : `\n\nMODO: Conversa livre.
Mantenha um diálogo natural e interessante sobre trabalho, viagens, cultura ou cotidiano.
Faça perguntas para manter a conversa fluindo.`;

  return `${personality}${modeInstruction}

REGRAS:
- Respostas concisas: máximo 3-4 frases curtas
- Sempre termine com uma pergunta para continuar a conversa
- Se receber "[INÍCIO DA SESSÃO]", dê boas-vindas e faça a primeira pergunta
- Use emojis com moderação
- Sem markdown complexo (sem headers, tabelas ou listas longas)
- Seu nome é ${tutor.name}`;
}

function cleanForSpeech(text: string): string {
  return text
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[☀-➿]/gu, '')
    .replace(/#/g, '')
    .replace(/\*/g, '')
    .replace(/_/g, '')
    .replace(/`/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();
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

    const adminSupabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const formData = await req.formData();
    const level = (formData.get('level') as string) || 'beginner';
    const mode = (formData.get('mode') as string) || 'free';
    const topic = (formData.get('topic') as string) || '';
    const historyRaw = (formData.get('history') as string) || '[]';
    const userApiKey = formData.get('userApiKey') as string | null;
    const userModel =
      (formData.get('userModel') as string) || 'claude-haiku-4-5-20251001';
    const audioFile = formData.get('file') as File | null;

    // Busca plano do usuário
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    const plan = profile?.plan || 'free';
    const hasApiKey = !!userApiKey;

    // Free não tem acesso ao tutor
    if (plan === 'free') {
      return new Response(JSON.stringify({ error: 'O Tutor de IA está disponível nos planos Practice e Fluent.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Valida modelo externo sem API key
    const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';
    const isCustomModel = userModel && userModel !== DEFAULT_MODEL;

    if (isCustomModel && !hasApiKey) {
      return new Response(JSON.stringify({
        error: `Você selecionou um modelo externo mas não adicionou uma API key. Adicione em Configurações → API Key própria.`
      }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Sem API key — verifica limite de 30 min/dia
    if (!hasApiKey) {
      const today = new Date().toISOString().split('T')[0];
      const { data: sessions } = await adminSupabase
        .from('tutor_sessions')
        .select('duration_seconds')
        .eq('user_id', user.id)
        .gte('created_at', today + 'T00:00:00Z');

      const totalSeconds = sessions?.reduce((acc, s) => acc + (s.duration_seconds || 0), 0) || 0;
      const LIMIT_SECONDS = 30 * 60;

      if (totalSeconds >= LIMIT_SECONDS) {
        return new Response(JSON.stringify({ error: 'Você atingiu o limite de 30 minutos de Tutor por dia. Use sua API key para sessões ilimitadas.' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    const history: { role: string; content: string }[] =
      JSON.parse(historyRaw);

    // Transcribe audio with Whisper when present
    let transcription = '';
    if (audioFile && audioFile.size > 0) {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiKey) throw new Error('OPENAI_API_KEY não configurada');

      const whisperForm = new FormData();
      whisperForm.append('file', audioFile);
      whisperForm.append('model', 'whisper-1');

      const whisperRes = await fetch(
        'https://api.openai.com/v1/audio/transcriptions',
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${openaiKey}` },
          body: whisperForm,
        },
      );

      if (!whisperRes.ok) {
        const err = await whisperRes.json();
        throw new Error(err.error?.message || 'Erro na transcrição de áudio');
      }

      const whisperData = await whisperRes.json();
      transcription = whisperData.text?.trim() || '';
    }

    // Build messages array for the model
    const userMessage = transcription || (history.length === 0 ? '[INÍCIO DA SESSÃO]' : null);

    const messages: { role: 'user' | 'assistant'; content: string }[] =
      history.map((h) => ({
        role: h.role as 'user' | 'assistant',
        content: h.content,
      }));

    if (userMessage) {
      messages.push({ role: 'user', content: userMessage });
    }

    if (messages.length === 0) {
      messages.push({ role: 'user', content: '[INÍCIO DA SESSÃO]' });
    }

    const systemPrompt = buildSystemPrompt(level, mode, topic);
    let tutorResponse = '';

    if (userModel.startsWith('gpt-')) {
      const openaiKey = Deno.env.get('OPENAI_API_KEY');
      if (!openaiKey) throw new Error('OPENAI_API_KEY não configurada');

      const chatRes = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${openaiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: userModel,
            messages: [
              { role: 'system', content: systemPrompt },
              ...messages,
            ],
            max_tokens: 512,
            temperature: 0.8,
          }),
        },
      );

      if (!chatRes.ok) {
        const err = await chatRes.json();
        throw new Error(err.error?.message || `Erro no modelo GPT: ${chatRes.status}`);
      }

      const chatData = await chatRes.json();
      tutorResponse = chatData.choices[0].message.content;
    } else {
      const apiKey = isCustomModel ? (userApiKey || Deno.env.get('ANTHROPIC_API_KEY')) : Deno.env.get('ANTHROPIC_API_KEY');
      if (!apiKey) throw new Error('ANTHROPIC_API_KEY não configurada');

      const anthropic = new Anthropic({ apiKey });
      const response = await anthropic.messages.create({
        model: userModel,
        max_tokens: 512,
        system: systemPrompt,
        messages,
      });

      tutorResponse = (response.content[0] as { type: string; text: string })
        .text;
    }

    // Append the exchanged turns to history
    const updatedHistory = [...history];
    if (userMessage) {
      updatedHistory.push({ role: 'user', content: userMessage });
    }
    updatedHistory.push({ role: 'assistant', content: tutorResponse });

    const tutor = TUTORS[level] || TUTORS.beginner;

    return new Response(
      JSON.stringify({
        transcription,
        tutor_response: tutorResponse,
        tutor_response_clean: cleanForSpeech(tutorResponse),
        tutor_name: tutor.name,
        history: updatedHistory,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erro interno';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
