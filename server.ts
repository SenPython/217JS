import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

dotenv.config();

// Helper to initialize Gemini safely
let ai: GoogleGenAI | null = null;
const apiKey = process.env.GEMINI_API_KEY;

function getGeminiClient(): GoogleGenAI {
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('Gemini API Key is not set or has the placeholder value. Please configure GEMINI_API_KEY in the Settings > Secrets matching of your AI Studio workspace.');
  }
  if (!ai) {
    ai = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  // API Check Status Endpoint
  app.get('/api/status', (req, res) => {
    res.json({
      hasKey: !!apiKey && apiKey !== 'MY_GEMINI_API_KEY',
      env: process.env.NODE_ENV || 'development',
    });
  });

  // API Route: Streaming Chat
  app.post('/api/chat-stream', async (req, res) => {
    try {
      const { message, systemInstruction, temperature, topP } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const client = getGeminiClient();

      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const responseStream = await client.models.generateContentStream({
        model: 'gemini-3.5-flash',
        contents: message,
        config: {
          systemInstruction: systemInstruction || 'You are a helpful AI assistant.',
          temperature: typeof temperature === 'number' ? temperature : undefined,
          topP: typeof topP === 'number' ? topP : undefined,
        },
      });

      for await (const chunk of responseStream) {
        res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
      }

      res.write('data: [DONE]\n\n');
      res.end();
    } catch (err: any) {
      console.error('Chat endpoint error:', err);
      // If headers or connection is already streaming, we can't send JSON error
      if (res.headersSent) {
        res.write(`data: ${JSON.stringify({ error: err.message || 'Streaming failed' })}\n\n`);
        res.end();
      } else {
        res.status(500).json({ error: err.message || 'Failed to generate content' });
      }
    }
  });

  // API Route: Search Grounding
  app.post('/api/grounding-search', async (req, res) => {
    try {
      const { message } = req.body;
      if (!message) {
        return res.status(400).json({ error: 'Query message is required' });
      }

      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: message,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      res.json({
        text: response.text,
        chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
        searchQueries: response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [],
      });
    } catch (err: any) {
      console.error('Search grounding error:', err);
      res.status(500).json({ error: err.message || 'Search grounding generation failed' });
    }
  });

  // API Route: Structured Output
  app.post('/api/generate-structured', async (req, res) => {
    try {
      const { type, prompt } = req.body;
      const client = getGeminiClient();

      let systemPrompt = '';
      let schema: any = {};

      if (type === 'itinerary') {
        systemPrompt = 'You are an elite travel concierge. Generate a detailed, engaging travel itinerary in JSON format matching the schema.';
        schema = {
          type: Type.OBJECT,
          properties: {
            destination: { type: Type.STRING, description: 'Proposed city and country' },
            duration: { type: Type.STRING, description: 'Length of stay, e.g. "3 Days"' },
            theme: { type: Type.STRING, description: 'Overall mood, e.g., Relaxing, Adventure' },
            highlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Key takeaways from the trip',
            },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  dayNumber: { type: Type.INTEGER, description: 'Numerical day count' },
                  title: { type: Type.STRING, description: 'Day theme/focus' },
                  activities: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        time: { type: Type.STRING, description: 'E.g., Morning, 2:00 PM' },
                        activity: { type: Type.STRING, description: 'Short title of activity' },
                        description: { type: Type.STRING, description: 'Brief evocative details' },
                      },
                      required: ['time', 'activity', 'description'],
                    },
                  },
                },
                required: ['dayNumber', 'title', 'activities'],
              },
            },
          },
          required: ['destination', 'duration', 'theme', 'highlights', 'days'],
        };
      } else if (type === 'code-review') {
        systemPrompt = 'You are a senior principal staff engineer. Critique the user-provided code, producing a rigorous code quality report matching the JSON schema.';
        schema = {
          type: Type.OBJECT,
          properties: {
            language: { type: Type.STRING, description: 'Identified programming language' },
            score: { type: Type.INTEGER, description: 'Overall score from 1 to 100' },
            summary: { type: Type.STRING, description: 'High-level synthesis of findings' },
            positives: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Things the author did correctly or elegantly',
            },
            issues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  file: { type: Type.STRING, description: 'Affected code section / symbol' },
                  line: { type: Type.INTEGER, description: 'Estimated line number or 0 if general' },
                  severity: { type: Type.STRING, description: 'critical, warning, or suggestion' },
                  description: { type: Type.STRING, description: 'In-depth description of technical flaw' },
                  fix: { type: Type.STRING, description: 'Syntactically valid solution code snippet' },
                },
                required: ['file', 'severity', 'description', 'fix'],
              },
            },
          },
          required: ['language', 'score', 'summary', 'positives', 'issues'],
        };
      } else { // default to 'recipe'
        systemPrompt = 'You are a Michelin-star culinary scientist. Formulate a detailed, delicious recipe in JSON matching the schema.';
        schema = {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: 'Evocative artisanal recipe name' },
            prepTime: { type: Type.STRING, description: 'Preparation time, e.g. "15 mins"' },
            cookTime: { type: Type.STRING, description: 'Cooking time, e.g. "45 mins"' },
            servings: { type: Type.STRING, description: 'Number of servings' },
            nutrition: {
              type: Type.OBJECT,
              properties: {
                calories: { type: Type.INTEGER },
                protein: { type: Type.STRING },
                carbs: { type: Type.STRING },
              },
              required: ['calories', 'protein', 'carbs'],
            },
            ingredients: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: 'Name of the ingredient item' },
                  amount: { type: Type.STRING, description: 'E.g., 2 tbsp, 200g' },
                },
                required: ['name', 'amount'],
              },
            },
            steps: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Sequential, foolproof step-by-step directions',
            },
          },
          required: ['name', 'prepTime', 'cookTime', 'servings', 'nutrition', 'ingredients', 'steps'],
        };
      }

      const inputPrompt = prompt || (type === 'itinerary' ? 'Paris for first-timers' : type === 'code-review' ? 'fn sum(a, b) { return a + b; }' : 'Chocolate Souffle');

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: inputPrompt,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: 'application/json',
          responseSchema: schema,
        },
      });

      const parsedData = JSON.parse(response.text || '{}');
      res.json(parsedData);
    } catch (err: any) {
      console.error('Structured generation error:', err);
      res.status(500).json({ error: err.message || 'Structured data generation failed' });
    }
  });

  // API Route: Text-To-Speech Narrator
  app.post('/api/generate-speech', async (req, res) => {
    try {
      const { text, voice } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text prompt is required' });
      }

      const client = getGeminiClient();
      const response = await client.models.generateContent({
        model: 'gemini-3.1-flash-tts-preview',
        contents: [{ parts: [{ text: text }] }],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: voice || 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new Error('No audio payload was returned by the model.');
      }

      res.json({ audio: base64Audio });
    } catch (err: any) {
      console.error('TTS endpoint error:', err);
      res.status(500).json({ error: err.message || 'Speech generation failed' });
    }
  });

  // Integration of frontend dev server and production serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = 3000;
  const server = http.createServer(app);
  const wss = new WebSocketServer({ server });

  // In-memory collections to persist chat, user, calling, and map data
  interface ActiveUser {
    id: string;
    name: string;
    email: string;
    avatar: string;
    status: 'online' | 'offline';
    isSharingLocation: boolean;
    location?: { lat: number; lng: number; accuracy?: number; updatedAt: number };
    lastSeen: number;
    companionCode?: string;
  }

  const usersMap = new Map<string, ActiveUser>();
  const messagesList: any[] = [];
  const storiesList: any[] = [];
  const clientSockets = new Map<string, WebSocket>();

  // Add some initial welcome messages in message list
  messagesList.push(
    {
      id: 'msg_welcome_1',
      roomId: 'all_chat',
      senderId: 'system',
      senderName: 'System Broadcast',
      senderAvatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=150&auto=format&fit=crop&q=80',
      text: 'Welcome to Sanpython Social Media! 🗺️ Toggle "Share Location" on above to display your coordinates on the map and interact with friends in real-time!',
      timestamp: Date.now()
    }
  );

  wss.on('connection', (ws) => {
    let currentUserId: string | null = null;

    ws.on('message', (messageBuffer) => {
      try {
        const data = JSON.parse(messageBuffer.toString());
        const { type, payload } = data;

        switch (type) {
          case 'join': {
            const { user } = payload;
            currentUserId = user.id;
            clientSockets.set(user.id, ws);

            const existing = usersMap.get(user.id);
            const updatedUser: ActiveUser = {
              id: user.id,
              name: user.name,
              email: user.email,
              avatar: user.avatar,
              status: 'online',
              isSharingLocation: existing ? existing.isSharingLocation : false,
              location: existing ? existing.location : undefined,
              lastSeen: Date.now(),
              companionCode: user.companionCode || ('SAN-' + Math.floor(1000 + Math.random() * 9000))
            };

            usersMap.set(user.id, updatedUser);

            // Broadcast all users
            const usersList = Array.from(usersMap.values());
            broadcast({ type: 'users_update', payload: { users: usersList } });

            // Send past message history and stories history
            ws.send(JSON.stringify({ type: 'message_history', payload: { messages: messagesList } }));
            ws.send(JSON.stringify({ type: 'stories_history', payload: { stories: storiesList } }));
            break;
          }

          case 'post_story': {
            const { story } = payload;
            const newStory = {
              id: story.id || 'story_' + Math.random().toString(36).substring(2, 11),
              userId: story.userId,
              username: story.username,
              userAvatar: story.userAvatar,
              mediaUrl: story.mediaUrl,
              captionText: story.captionText,
              backgroundGradient: story.backgroundGradient,
              timestamp: Date.now()
            };
            storiesList.push(newStory);
            if (storiesList.length > 50) {
              storiesList.shift();
            }
            broadcast({ type: 'stories_update', payload: { stories: storiesList } });
            break;
          }

          case 'send_message': {
            const { message } = payload;
            const newMessage = {
              id: message.id || 'msg_' + Math.random().toString(36).substring(2, 11),
              roomId: message.roomId || 'all_chat',
              senderId: message.senderId,
              senderName: message.senderName,
              senderAvatar: message.senderAvatar,
              text: message.text,
              mediaUrl: message.mediaUrl,
              mediaType: message.mediaType,
              timestamp: Date.now()
            };

            // Push to history
            messagesList.push(newMessage);
            if (messagesList.length > 500) {
              messagesList.shift();
            }

            broadcast({ type: 'new_message', payload: { message: newMessage } });
            break;
          }

          case 'update_location': {
            if (!currentUserId) return;
            const { location, isSharingLocation } = payload;
            const usr = usersMap.get(currentUserId);
            if (usr) {
              usr.isSharingLocation = isSharingLocation;
              usr.location = location ? { ...location, updatedAt: Date.now() } : undefined;
              usr.lastSeen = Date.now();
              usersMap.set(currentUserId, usr);

              const usersList = Array.from(usersMap.values());
              broadcast({ type: 'users_update', payload: { users: usersList } });
            }
            break;
          }

          case 'call_initiate': {
            const { call } = payload;
            // Send call offer to the receiver
            const targetSocket = clientSockets.get(call.receiverId);
            if (targetSocket) {
              targetSocket.send(JSON.stringify({ type: 'incoming_call', payload: { call } }));
            }
            break;
          }

          case 'call_response': {
            const { callId, receiverId, callerId, status } = payload;
            const targetSocket = clientSockets.get(callerId);
            if (targetSocket) {
              targetSocket.send(JSON.stringify({ type: 'call_status_update', payload: { callId, status } }));
            }
            break;
          }

          case 'webrtc_signal': {
            const { to, signal } = payload;
            const targetSocket = clientSockets.get(to);
            if (targetSocket) {
              targetSocket.send(JSON.stringify({ type: 'webrtc_signal', payload: { from: currentUserId, signal } }));
            }
            break;
          }

          case 'candidate': {
            const { to, candidate } = payload;
            const targetSocket = clientSockets.get(to);
            if (targetSocket) {
              targetSocket.send(JSON.stringify({ type: 'candidate', payload: { from: currentUserId, candidate } }));
            }
            break;
          }

          default:
            break;
        }
      } catch (err) {
        console.error('WebSocket message processing error:', err);
      }
    });

    ws.on('close', () => {
      if (currentUserId) {
        clientSockets.delete(currentUserId);
        const usr = usersMap.get(currentUserId);
        if (usr) {
          usr.status = 'offline';
          usr.lastSeen = Date.now();
          usersMap.set(currentUserId, usr);
        }
        const usersList = Array.from(usersMap.values());
        broadcast({ type: 'users_update', payload: { users: usersList } });
      }
    });

    function broadcast(data: any) {
      const msg = JSON.stringify(data);
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(msg);
        }
      });
    }
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`[FULL-STACK] Combined HTTP & WebSocket Server listening on port ${port}`);
  });
}

startServer();
