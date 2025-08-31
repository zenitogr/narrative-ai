import Groq from 'groq-sdk';

let groq: Groq;

if (typeof window !== 'undefined' && localStorage.getItem('customProviderUrl')) {
  groq = new Groq({
    apiKey: localStorage.getItem('customApiKey') || '',
    baseURL: localStorage.getItem('customProviderUrl') || '',
  });
} else {
  groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });
}


export async function getGroqModels() {
  const models = await groq.models.list();
  return models.data;
}

export default groq;