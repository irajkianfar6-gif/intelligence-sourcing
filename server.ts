import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || !apiKey.trim()) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  // Deep Supplier & Price Extraction Endpoint (Gemini + Google Search Grounding)
  app.post('/api/discovery/extract', async (req, res) => {
    const {
      productName = 'ورق فولادی گالوانیزه گرم Z275',
      hsCode = '7210.49',
      technicalSpecs = '',
      targetCountries = ['ویتنام', 'ترکیه', 'هند', 'چین'],
      targetMaxFobUSD = 700,
    } = req.body || {};

    const ai = getAiClient();
    if (!ai) {
      return res.json({
        aiEnabled: false,
        items: [],
        groundingUrls: [],
        synthesisFa: '',
      });
    }

    try {
      // Step 1: Grounded search for real global manufacturers and current FOB export prices
      const searchPrompt = `Find real direct manufacturers, export mills, and current FOB export price ranges (USD per MT/unit) for the industrial product "${productName}" (HS Code: ${hsCode}, Technical specs: ${technicalSpecs || 'Standard export prime grade'}) in countries: ${targetCountries.join(', ')}. Provide a concise analytical summary in Persian (فارسی) and list 3 to 4 real verified manufacturers with their English name, Persian name, country (in Persian from: ویتنام, ترکیه, هند, چین, کره جنوبی, امارات), city/port, estimated FOB unit price in USD (near ${targetMaxFobUSD} USD), monthly capacity in MT, MOQ in MT, founded year, and short Persian description.`;

      const groundedResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: searchPrompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const groundingChunks =
        groundedResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const groundingUrls: { title: string; uri: string }[] = [];
      for (const chunk of groundingChunks) {
        if (chunk.web?.uri) {
          groundingUrls.push({
            title: chunk.web.title || chunk.web.uri,
            uri: chunk.web.uri,
          });
        }
      }

      const rawText = groundedResponse.text || '';

      // Step 2: Structured extraction into clean JSON schema
      const structuredResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Extract the supplier and price intelligence from the following trade research into structured JSON:\n\n${rawText}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              synthesisFa: {
                type: Type.STRING,
                description: 'خلاصه تحلیلی بازار و قیمت‌های کشف شده به زبان فارسی',
              },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    faName: { type: Type.STRING },
                    country: { type: Type.STRING },
                    city: { type: Type.STRING },
                    type: { type: Type.STRING },
                    unitPriceFobUSD: { type: Type.NUMBER },
                    moq: { type: Type.NUMBER },
                    capacityMonthly: { type: Type.NUMBER },
                    foundedYear: { type: Type.INTEGER },
                    descriptionFa: { type: Type.STRING },
                  },
                  required: ['name', 'country', 'unitPriceFobUSD'],
                },
              },
            },
            required: ['synthesisFa', 'items'],
          },
        },
      });

      const parsed = JSON.parse((structuredResponse.text || '{}').trim());
      return res.json({
        aiEnabled: true,
        items: Array.isArray(parsed.items) ? parsed.items : [],
        groundingUrls,
        synthesisFa: parsed.synthesisFa || '',
      });
    } catch (error: any) {
      return res.json({
        aiEnabled: false,
        items: [],
        groundingUrls: [],
        synthesisFa: '',
        fallbackReason: error?.message || 'Fallback to deterministic trade database',
      });
    }
  });

  // Alibaba Deep Verified Supplier Scanner Endpoint (site:alibaba.com + urlContext)
  app.post('/api/discovery/alibaba-scan', async (req, res) => {
    const {
      productKeyword = 'Hot-Dip Galvanized Steel Coil Z275',
      hsCode = '7210.49',
      directAlibabaUrl = '',
      onlyVerifiedPro = true,
      targetMaxFobUSD = 700,
    } = req.body || {};

    const ai = getAiClient();
    if (!ai) {
      return res.json({
        aiEnabled: false,
        items: [],
        groundingUrls: [],
        synthesisFa: '',
      });
    }

    try {
      const tools: any[] = [{ googleSearch: {} }];
      if (directAlibabaUrl && directAlibabaUrl.trim().startsWith('http')) {
        tools.push({ urlContext: {} });
      }

      const alibabaPrompt = `Search site:alibaba.com for ${onlyVerifiedPro ? 'Verified Pro (SGS / TÜV audited)' : 'Verified'} direct manufacturers of "${productKeyword}" (HS Code: ${hsCode})${directAlibabaUrl ? ` and analyze this Alibaba URL: ${directAlibabaUrl}` : ''}. Identify 2 to 3 real verified factory stores on Alibaba.com, their estimated FOB price in USD (near ${targetMaxFobUSD} USD), MOQ, monthly capacity, city, and write a brief Persian analytical summary explaining their Trade Assurance and factory audit status.`;

      const groundedResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: alibabaPrompt,
        config: {
          tools,
        },
      });

      const groundingChunks =
        groundedResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const groundingUrls: { title: string; uri: string }[] = [];
      for (const chunk of groundingChunks) {
        if (chunk.web?.uri) {
          groundingUrls.push({
            title: chunk.web.title || chunk.web.uri,
            uri: chunk.web.uri,
          });
        }
      }

      const rawText = groundedResponse.text || '';
      const structuredResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: `Extract Alibaba verified supplier details from the following research into JSON:\n\n${rawText}`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              synthesisFa: { type: Type.STRING },
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    faName: { type: Type.STRING },
                    country: { type: Type.STRING },
                    city: { type: Type.STRING },
                    unitPriceFobUSD: { type: Type.NUMBER },
                    moq: { type: Type.NUMBER },
                    capacityMonthly: { type: Type.NUMBER },
                    foundedYear: { type: Type.INTEGER },
                  },
                  required: ['name', 'country', 'unitPriceFobUSD'],
                },
              },
            },
            required: ['synthesisFa', 'items'],
          },
        },
      });

      const parsed = JSON.parse((structuredResponse.text || '{}').trim());
      return res.json({
        aiEnabled: true,
        items: Array.isArray(parsed.items) ? parsed.items : [],
        groundingUrls,
        synthesisFa: parsed.synthesisFa || '',
      });
    } catch (error: any) {
      return res.json({
        aiEnabled: false,
        items: [],
        groundingUrls: [],
        synthesisFa: '',
        fallbackReason: error?.message || 'Fallback to Alibaba verified trade database',
      });
    }
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`SourcingIQ server running on http://0.0.0.0:${port}`);
  });
}

startServer();
