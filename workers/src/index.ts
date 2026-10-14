import { Env, jsonResponse, errorResponse } from './shared';
import { handleAnalyzeMeal } from './analyze-meal';
import { handleCoachChat } from './coach-chat';
import { handleLookupNutrition } from './lookup-nutrition';
import { handleParseVoice } from './parse-voice';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }

    if (request.method === 'GET' && url.pathname === '/health') {
      return jsonResponse({ status: 'ok' });
    }

    if (request.method !== 'POST') return errorResponse('Method not allowed', 405);

    if (url.pathname === '/api/analyze-meal') return handleAnalyzeMeal(request, env);
    if (url.pathname === '/api/coach-chat') return handleCoachChat(request, env);
    if (url.pathname === '/api/lookup-nutrition') return handleLookupNutrition(request, env);
    if (url.pathname === '/api/parse-voice') return handleParseVoice(request, env);

    return errorResponse('Not found', 404);
  },
};