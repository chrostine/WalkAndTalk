import type { APIRoute } from 'astro';

export const prerender = false;

const SYSTEM_PROMPT = `Du er en varm, empatisk lytter og hjælper i en app om mental sundhed.
Din rolle er at lytte aktivt, stille åbne, nysgerrige spørgsmål, og hjælpe brugeren
med at reflektere over egne tanker og følelser. Vær rolig, ikke-dømmende og støttende.

Du må gerne give generelle råd om trivsel, stresshåndtering og selvomsorg, men du er
ikke en erstatning for professionel hjælp. Hvis brugeren beskriver alvorlig mistrivsel,
selvskade eller selvmordstanker, skal du venligt opfordre dem til at kontakte en
professionel (fx læge, psykolog) eller en kriselinje, og du må ikke give konkrete
metoder eller medicinske anbefalinger.

Svar altid på dansk, i et roligt og varmt sprog, og hold svarene relativt korte.`;

export const POST: APIRoute = async ({ request }) => {
  const { messages } = await request.json();

  const contents = messages.map((m: { role: string; text: string }) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.text }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${import.meta.env.GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: SYSTEM_PROMPT }],
        },
        contents,
      }),
    }
  );

  if (res.status === 429) {
  return new Response(JSON.stringify({ 
    reply: 'Jeg er lidt træt lige nu — prøv igen i morgen.' 
  }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

  const data = await res.json();
  // debug
  // console.log("Gemini status:", res.status);
  // console.log("Gemini svar:", JSON.stringify(data, null, 2));
  const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? 'Hmm, jeg kunne ikke svare.';

  return new Response(JSON.stringify({ reply }), {
    headers: { 'Content-Type': 'application/json' },
  });
};