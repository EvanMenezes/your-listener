async function enhanceText({ mode = 'local', endpoint = '', apiKey = '', text = '', style = 'natural' }) {
  const original = String(text || '').trim();
  if (!original) return { ok: true, text: '' };
  const local = original.replace(/\b(um|uh|erm|hmm)\b[\s,]*/gi, '').replace(/\s+([,.!?])/g, '$1').replace(/\s{2,}/g, ' ').trim();
  if (mode === 'local' || !apiKey) return { ok: true, text: local, provider: 'local' };
  const url = endpoint || 'https://api.openai.com/v1/chat/completions';
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.1,
        messages: [
          { role: 'system', content: `Clean spoken dictation into polished text. Preserve meaning. Remove filler words, add punctuation, and use a ${style} writing style. Return only the final text.` },
          { role: 'user', content: original }
        ]
      })
    });
    if (!response.ok) return { ok: true, text: local, provider: 'local-fallback', warning: `Cloud provider returned ${response.status}.` };
    const json = await response.json();
    const textOut = json?.choices?.[0]?.message?.content?.trim();
    return { ok: true, text: textOut || local, provider: 'cloud' };
  } catch (error) {
    return { ok: true, text: local, provider: 'local-fallback', warning: error.message };
  }
}
module.exports = { enhanceText };
