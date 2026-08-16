const SENSITIVE = /\b(call|phone|message|send|submit|purchase|buy|delete|remove|edit|create|post|pay|transfer|book)\b/i;
const NEEDS_TARGET = /\b(call|message|send|email|open|edit|delete|create|book|schedule)\b/i;
function clean(input){return String(input||'').replace(/\s+/g,' ').trim().slice(0,4000)}
function refine(input, context={}){
  const original=clean(input); const questions=[]; const warnings=[];
  if(!original){return {ok:false,original:'',quality:0,questions:['What would you like me to do?'],warnings:[],prompt:''}}
  if(NEEDS_TARGET.test(original) && !context.target && !/\b(to|for|on|at|in)\b/i.test(original)) questions.push('Which person, app, website, or record is the target?');
  if(SENSITIVE.test(original)) warnings.push('This request may cause an external or destructive side effect and requires a preview plus explicit confirmation.');
  const tone=context.tone||'clear and professional';
  const format=context.format||'preserve the user\'s intended meaning, remove filler, and use sensible punctuation';
  const app=context.app||'the active application';
  const prompt=[`Task: ${original}`,`Context: ${app}.`,`Quality requirements: ${tone}; ${format}.`,`Execution rules: do not invent missing names, dates, amounts, recipients, or permissions; ask a focused clarification question when required; show a preview before sensitive actions; report the result and any limitation.`].join('\n');
  const quality=Math.max(20,100-(questions.length*25)-(warnings.length*10));
  return {ok:true,original,quality,questions,warnings,prompt,needsConfirmation:warnings.length>0,context:{tone,format,app}};
}
module.exports={refine};
