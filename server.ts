import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import cors from "cors";
import { candidateShortlist } from "./services/recommendation/shortlist";
import {
  inferEmotionState,
  buildFeedbackEntries,
  DEFAULT_PLUTCHIK,
  EMOTION_LABELS,
} from "./services/recommendation/inference";
import { OilEntry } from "./types";

// --- Recommendation engine (rules → DeepSeek/Gemini → strict JSON) ---

function parseLooseJson(text: string): Record<string, unknown> | null {
  const trimmed = (text || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    /* try fallbacks below */
  }
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try {
      return JSON.parse(fence[1].trim());
    } catch {
      /* ignore */
    }
  }
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(trimmed.slice(first, last + 1));
    } catch {
      /* ignore */
    }
  }
  return null;
}

const defaultAromaReason = (oil: OilEntry, dominantLabel: string): string =>
  `«${oil.name}» мягко поддерживает состояние «${dominantLabel.toLowerCase()}». ${oil.description}`;

const defaultInsight = (oil: OilEntry): string =>
  `Сделайте несколько спокойных вдохов с «${oil.name}» и вернитесь к себе. ${oil.instruction}`;

interface OilSelection {
  oilId: string;
  aromaReason: string;
  insight: string;
}

async function selectOilWithLLM(
  shortlist: OilEntry[],
  microInput: string,
  dominantLabel: string
): Promise<OilSelection | null> {
  const summary = shortlist
    .map((o) => `- id: ${o.id} | ${o.name} — ${o.description} (${o.instruction})`)
    .join("\n");

  const system =
    "Ты — эмпатичный ароматерапевт в приложении «Внутренний Компас». " +
    "Выбери РОВНО одно эфирное масло из предложенного списка (по полю id), " +
    "которое наилучшим образом поддержит текущее состояние пользователя. " +
    "Не выдумывай масла, которых нет в списке.";

  const user = [
    `Текущее состояние пользователя: «${dominantLabel}».`,
    `Его слова: «${microInput}».`,
    "",
    "Доступные масла (шорт-лист):",
    summary,
    "",
    'Ответь строго одним JSON-объектом без markdown: {"oilId":"<id>","aromaReason":"<почему это масло подходит, 1-2 предложения>","insight":"<тёплое поддерживающее напутствие на сегодня, 1-2 предложения>"}',
  ].join("\n");

  // 1) DeepSeek (primary)
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey) {
    try {
      const resp = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${deepseekKey}`,
        },
        body: JSON.stringify({
          model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
          response_format: { type: "json_object" },
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        const content: string = data.choices?.[0]?.message?.content || "";
        const parsed = parseLooseJson(content);
        if (parsed && typeof parsed.oilId === "string") {
          return {
            oilId: parsed.oilId,
            aromaReason: typeof parsed.aromaReason === "string" ? parsed.aromaReason : "",
            insight: typeof parsed.insight === "string" ? parsed.insight : "",
          };
        }
      }
    } catch (err) {
      console.warn("DeepSeek recommendation failed, trying Gemini...", err);
    }
  }

  // 2) Gemini (fallback)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const resGen = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: system + "\n\n" + user,
      });
      const text = resGen.text || "";
      const parsed = parseLooseJson(text);
      if (parsed && typeof parsed.oilId === "string") {
        return {
          oilId: parsed.oilId,
          aromaReason: typeof parsed.aromaReason === "string" ? parsed.aromaReason : "",
          insight: typeof parsed.insight === "string" ? parsed.insight : "",
        };
      }
    } catch (err) {
      console.warn("Gemini recommendation failed, using local template...", err);
    }
  }

  return null;
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  }));
  app.use(express.json({ limit: "15mb" }));

  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // VK OAuth Routes
  const VK_APP_ID = process.env.VK_APP_ID || "54703393";
  const VK_CLIENT_SECRET = process.env.VK_CLIENT_SECRET || "";

  app.get("/api/auth/vk/config", (req, res) => {
    const host = req.get("x-forwarded-host") || req.get("host") || "wellness-anton56.amvera.io";
    const proto = req.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const redirectUri = `${proto}://${host}/api/auth/vk/callback`;
    res.json({
      appId: VK_APP_ID,
      redirectUri: redirectUri,
      isConfigured: VK_APP_ID !== "54700577" && VK_CLIENT_SECRET !== ""
    });
  });

  app.get("/api/auth/vk/url", (req, res) => {
    const host = req.get("x-forwarded-host") || req.get("host") || "wellness-anton56.amvera.io";
    const proto = req.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const redirectUri = `${proto}://${host}/api/auth/vk/callback`;
    const state = Math.random().toString(36).substring(2, 15);
    const useLegacy = req.query.legacy === "true";

    if (useLegacy) {
      const vkAuthUrl = `https://oauth.vk.com/authorize?client_id=${VK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&display=page&scope=email&response_type=code&v=5.131&state=${state}`;
      res.json({ url: vkAuthUrl });
    } else {
      // VK ID uses id.vk.ru/authorize with scope, state, client_id, and redirect_uri
      const vkAuthUrl = `https://id.vk.ru/authorize?client_id=${VK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=vkid.personal_info%20email&state=${state}`;
      res.json({ url: vkAuthUrl });
    }
  });

  app.post("/api/auth/vk/token-login", async (req, res) => {
    try {
      const { access_token, user_id, email } = req.body;
      if (!access_token || !user_id) {
        return res.status(400).json({ error: "Missing access_token or user_id" });
      }
      const userUrl = `https://api.vk.com/method/users.get?user_ids=${user_id}&fields=photo_200&access_token=${access_token}&v=5.131`;
      const userRes = await fetch(userUrl);
      const userData = await userRes.json();
      const vkUser = userData.response?.[0] || {};

      const userEmail = email || `vk_${user_id}@vk.com`;
      const userName = `${vkUser.first_name || 'Пользователь'} ${vkUser.last_name || 'VK'}`.trim();

      const userPayload = {
        uid: `vk:${user_id}`,
        email: userEmail,
        name: userName,
        provider: 'vk',
        vkUserId: user_id
      };
      res.json(userPayload);
    } catch (err: any) {
      console.error("VK token-login error:", err);
      res.status(500).json({ error: "Failed to fetch VK profile" });
    }
  });

  app.get("/api/auth/vk/callback", async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        // Поддержка Implicit Flow (response_type=token), где параметры приходят в URL hash (#access_token=...)
        return res.send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>VK Auth</title>
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #f5f5f7; color: #1d1d1f; }
                .btn { display: inline-block; background: #0077FF; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
              </style>
            </head>
            <body>
              <h2 id="title">Авторизация через VK...</h2>
              <p id="status">Обработка данных авторизации</p>
              <a id="btn" class="btn" style="display:none;" href="#">Открыть приложение</a>
              <script>
                (function() {
                  const hash = window.location.hash.substring(1);
                  const params = new URLSearchParams(hash || window.location.search);
                  
                  if (params.get('error')) {
                    document.getElementById('title').innerText = 'Ошибка авторизации VK';
                    document.getElementById('status').innerText = (params.get('error_description') || params.get('error'));
                    return;
                  }

                  const accessToken = params.get('access_token');
                  const userId = params.get('user_id');
                  const email = params.get('email') || '';

                  if (!accessToken || !userId) {
                    document.getElementById('title').innerText = 'Ошибка авторизации';
                    document.getElementById('status').innerText = 'Токен доступа не найден. Попробуйте снова.';
                    return;
                  }

                  fetch('/api/auth/vk/token-login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ access_token: accessToken, user_id: userId, email: email })
                  })
                  .then(r => r.json())
                  .then(userData => {
                    if (userData.error) {
                      document.getElementById('title').innerText = 'Ошибка профиля';
                      document.getElementById('status').innerText = userData.error;
                      return;
                    }

                    document.getElementById('title').innerText = 'Авторизация через VK успешна!';
                    document.getElementById('status').innerText = 'Возвращаем вас в приложение...';
                    
                    const deepLinkUrl = "wellness://auth?data=" + encodeURIComponent(JSON.stringify(userData));
                    const btn = document.getElementById('btn');
                    btn.href = deepLinkUrl;
                    btn.style.display = 'inline-block';

                    if (window.opener) {
                      window.opener.postMessage({ type: 'VK_AUTH_SUCCESS', user: userData }, '*');
                      setTimeout(() => window.close(), 500);
                    } else {
                      localStorage.setItem('vk_auth_user', JSON.stringify(userData));
                      window.location.href = deepLinkUrl;
                      setTimeout(() => {
                        window.location.href = '/';
                      }, 1500);
                    }
                  })
                  .catch(err => {
                    document.getElementById('title').innerText = 'Ошибка соединения';
                    document.getElementById('status').innerText = err.message;
                  });
                })();
              </script>
            </body>
          </html>
        `);
      }

      const host = req.get("x-forwarded-host") || req.get("host") || "internal-compass.ru";
      const proto = req.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      const redirectUri = `${proto}://${host}/api/auth/vk/callback`;

      // 1. Exchange code for access token
      let tokenData: any = null;
      let exchangeErrors: string[] = [];

      // Method A: Attempt new VK ID token exchange via id.vk.com POST request
      try {
        console.log("Attempting token exchange via VK ID (id.vk.com/oauth2/auth)...");
        const body = new URLSearchParams({
          grant_type: "authorization_code",
          client_id: VK_APP_ID,
          client_secret: VK_CLIENT_SECRET,
          redirect_uri: redirectUri,
          code: code as string,
          state: (req.query.state as string) || "state",
          device_id: "device_id_web_client"
        });
        const response = await fetch("https://id.vk.com/oauth2/auth", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: body.toString()
        });
        if (response.ok) {
          const data = await response.json();
          if (data && !data.error) {
            tokenData = data;
            console.log("VK ID token exchange successful:", {
              user_id: tokenData.user_id,
              has_access_token: !!tokenData.access_token
            });
          } else {
            const errorDesc = data ? (data.error_description || data.error) : "empty response";
            exchangeErrors.push(`VK ID API error: ${errorDesc}`);
            console.warn("VK ID token exchange returned error:", data);
          }
        } else {
          const text = await response.text();
          exchangeErrors.push(`VK ID HTTP status ${response.status}: ${text}`);
          console.warn(`VK ID token exchange failed with HTTP status ${response.status}:`, text);
        }
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        exchangeErrors.push(`VK ID exception: ${errMsg}`);
        console.error("VK ID token exchange exception:", err);
      }

      // Method B: Fallback to legacy VK OAuth token exchange
      if (!tokenData) {
        try {
          console.log("Attempting legacy VK OAuth token exchange (oauth.vk.com/access_token)...");
          const tokenUrl = `https://oauth.vk.com/access_token?client_id=${VK_APP_ID}&client_secret=${VK_CLIENT_SECRET}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`;
          const tokenRes = await fetch(tokenUrl);
          if (tokenRes.ok) {
            const data = await tokenRes.json();
            if (data && !data.error) {
              tokenData = data;
              console.log("Legacy VK OAuth token exchange successful:", {
                user_id: tokenData.user_id,
                has_access_token: !!tokenData.access_token
              });
            } else {
              const errorDesc = data ? (data.error_description || data.error) : "empty response";
              exchangeErrors.push(`Legacy VK API error: ${errorDesc}`);
              console.warn("Legacy VK token exchange returned error:", data);
            }
          } else {
            const text = await tokenRes.text();
            exchangeErrors.push(`Legacy VK HTTP status ${tokenRes.status}: ${text}`);
            console.warn(`Legacy VK token exchange failed with HTTP status ${tokenRes.status}:`, text);
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : String(err);
          exchangeErrors.push(`Legacy VK exception: ${errMsg}`);
          console.error("Legacy VK token exchange exception:", err);
        }
      }

      if (!tokenData) {
        console.error("Both VK ID and legacy VK token exchange failed:", exchangeErrors);
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>VK Auth Error</title>
              <style>
                body { font-family: system-ui, sans-serif; padding: 40px; background: #fff5f5; color: #c53030; line-height: 1.6; max-width: 600px; margin: 0 auto; text-align: center; }
                h1 { margin-bottom: 20px; }
                ul { text-align: left; margin: 20px auto; max-width: 500px; }
                pre { background: #fee2e2; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 13px; text-align: left; }
                .btn { display: inline-block; background: #0077FF; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
              </style>
            </head>
            <body>
              <h1>Ошибка авторизации VK ID</h1>
              <p>Не удалось обменять код авторизации на токен доступа. Возможные причины:</p>
              <ul>
                <li>Неверный <strong>Client Secret (Защищенный ключ)</strong> в настройках приложения.</li>
                <li>Неверный <strong>App ID (ID приложения)</strong>.</li>
                <li>Адрес обратного вызова (Redirect URI) не совпадает с указанным в кабинете разработчика VK ID.</li>
              </ul>
              <p>Детали ошибок:</p>
              <pre>${exchangeErrors.join("\n")}</pre>
              <p>Ваш текущий Redirect URI: <code>${redirectUri}</code></p>
              <p>Ваш текущий App ID: <code>${VK_APP_ID}</code></p>
              <a class="btn" href="/">Вернуться на главную</a>
            </body>
          </html>
        `);
      }

      const { access_token, user_id, email } = tokenData;

      // 2. Get VK user details
      const userUrl = `https://api.vk.com/method/users.get?user_ids=${user_id}&fields=photo_200&access_token=${access_token}&v=5.131`;
      const userRes = await fetch(userUrl);
      const userData = await userRes.json();
      const vkUser = userData.response?.[0] || {};

      const userEmail = email || `vk_${user_id}@vk.com`;
      const userName = `${vkUser.first_name || 'Пользователь'} ${vkUser.last_name || 'VK'}`.trim();

      // Return script to pass user info back to window.opener or redirect
      const userPayload = JSON.stringify({
        uid: `vk:${user_id}`,
        email: userEmail,
        name: userName,
        provider: 'vk',
        vkUserId: user_id
      });

      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>VK Auth</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #f5f5f7; color: #1d1d1f; }
              .btn { display: inline-block; background: #0077FF; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h2>Авторизация через VK успешна!</h2>
            <p>Возвращаем вас в приложение...</p>
            <a class="btn" href="wellness://auth?data=${encodeURIComponent(userPayload)}">Открыть приложение</a>
            <script>
              const userData = ${userPayload};
              const deepLinkUrl = "wellness://auth?data=" + encodeURIComponent(JSON.stringify(userData));
              
              localStorage.setItem('vk_auth_user', JSON.stringify(userData));
              
              try {
                const bc = new BroadcastChannel('oauth_channel');
                bc.postMessage({ type: 'VK_AUTH_SUCCESS', user: userData });
              } catch (e) {}

              if (window.opener) {
                try {
                  window.opener.postMessage({ type: 'VK_AUTH_SUCCESS', user: userData }, '*');
                } catch(e) {}
                setTimeout(() => { window.close(); }, 300);
              } else {
                setTimeout(() => { window.location.href = '/'; }, 500);
              }
            </script>
          </body>
        </html>
      `);
    } catch (err: any) {
      console.error("VK Callback Error:", err);
      res.status(500).send("Ошибка при входе через VK: " + (err?.message || "Unknown error"));
    }
  });

  // Yandex OAuth Routes
  const YANDEX_CLIENT_ID = process.env.YANDEX_CLIENT_ID || process.env.VITE_YANDEX_CLIENT_ID || "";
  const YANDEX_CLIENT_SECRET = process.env.YANDEX_CLIENT_SECRET || "";

  app.get("/api/auth/yandex/config", (req, res) => {
    const host = req.get("x-forwarded-host") || req.get("host") || "wellness-anton56.amvera.io";
    const proto = req.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const redirectUri = `${proto}://${host}/api/auth/yandex/callback`;
    res.json({
      clientId: YANDEX_CLIENT_ID,
      redirectUri: redirectUri,
      isConfigured: YANDEX_CLIENT_ID !== "" && YANDEX_CLIENT_SECRET !== ""
    });
  });

  app.get("/api/auth/yandex/url", (req, res) => {
    const host = req.get("x-forwarded-host") || req.get("host") || "wellness-anton56.amvera.io";
    const proto = req.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const redirectUri = `${proto}://${host}/api/auth/yandex/callback`;
    const state = Math.random().toString(36).substring(2, 15);
    const yandexAuthUrl = `https://oauth.yandex.ru/authorize?response_type=code&client_id=${YANDEX_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;
    res.json({ url: yandexAuthUrl });
  });

  app.get("/api/auth/yandex/callback", async (req, res) => {
    try {
      const { code, state } = req.query;
      if (!code) {
        return res.status(400).send("Отсутствует код авторизации Yandex");
      }

      const host = req.get("x-forwarded-host") || req.get("host") || "wellness-anton56.amvera.io";
      const proto = req.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
      const redirectUri = `${proto}://${host}/api/auth/yandex/callback`;

      // Exchange code for token
      console.log("Attempting Yandex OAuth token exchange...");
      const bodyParams = new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        client_id: YANDEX_CLIENT_ID,
        client_secret: YANDEX_CLIENT_SECRET,
        redirect_uri: redirectUri
      });

      const tokenResponse = await fetch("https://oauth.yandex.ru/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: bodyParams.toString()
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        console.error("Yandex Token exchange error response:", errorText);
        return res.status(400).send(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>Yandex Auth Error</title>
              <style>
                body { font-family: system-ui, sans-serif; padding: 40px; background: #fff5f5; color: #c53030; line-height: 1.6; max-width: 600px; margin: 0 auto; text-align: center; }
                h1 { margin-bottom: 20px; }
                pre { background: #fee2e2; padding: 15px; border-radius: 8px; overflow-x: auto; font-size: 13px; text-align: left; }
                .btn { display: inline-block; background: #FC3F1D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
              </style>
            </head>
            <body>
              <h1>Ошибка авторизации Яндекс ID</h1>
              <p>Не удалось обменять код на токен доступа. Ответ Яндекса:</p>
              <pre>${errorText}</pre>
              <p>Проверьте Client ID и Client Secret в вашем окружении.</p>
              <p>Ваш Redirect URI в Яндексе должен быть: <code>${redirectUri}</code></p>
              <a class="btn" href="/">Вернуться на главную</a>
            </body>
          </html>
        `);
      }

      const tokenData = await tokenResponse.json();
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        return res.status(400).send("Не получен access_token от Яндекса");
      }

      // Fetch Yandex user profile
      console.log("Fetching Yandex user profile info...");
      const infoResponse = await fetch("https://login.yandex.ru/info?format=json", {
        headers: {
          "Authorization": `OAuth ${accessToken}`
        }
      });

      if (!infoResponse.ok) {
        const infoErrorText = await infoResponse.text();
        console.error("Yandex info fetch error:", infoErrorText);
        return res.status(400).send("Не удалось получить профиль Яндекс ID: " + infoErrorText);
      }

      const yandexUser = await infoResponse.json();
      console.log("Yandex user profile info fetched successfully:", yandexUser.id);

      const userEmail = yandexUser.default_email || (yandexUser.login ? `${yandexUser.login}@yandex.ru` : "yandex_user@yandex.ru");
      const userName = yandexUser.display_name || yandexUser.real_name || `${yandexUser.first_name || ""} ${yandexUser.last_name || ""}`.trim() || yandexUser.login || "Пользователь Яндекс";

      const userPayload = JSON.stringify({
        uid: `yandex:${yandexUser.id}`,
        email: userEmail,
        name: userName,
        provider: 'yandex',
        yandexUserId: yandexUser.id
      });

      res.send(`
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Yandex Auth</title>
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, sans-serif; text-align: center; padding: 40px; background: #f5f5f7; color: #1d1d1f; }
              .btn { display: inline-block; background: #FC3F1D; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 20px; }
            </style>
          </head>
          <body>
            <h2>Авторизация через Яндекс успешна!</h2>
            <p>Возвращаем вас в приложение...</p>
            <a class="btn" href="wellness://auth?data=${encodeURIComponent(userPayload)}">Открыть приложение</a>
            <script>
              const userData = ${userPayload};
              const deepLinkUrl = "wellness://auth?data=" + encodeURIComponent(JSON.stringify(userData));
              
              localStorage.setItem('yandex_auth_user', JSON.stringify(userData));
              
              try {
                const bc = new BroadcastChannel('oauth_channel');
                bc.postMessage({ type: 'YANDEX_AUTH_SUCCESS', user: userData });
              } catch (e) {}

              if (window.opener) {
                try {
                  window.opener.postMessage({ type: 'YANDEX_AUTH_SUCCESS', user: userData }, '*');
                } catch(e) {}
                setTimeout(() => { window.close(); }, 300);
              } else {
                // Attempt deep link navigation back to Capacitor mobile app
                window.location.href = deepLinkUrl;
                setTimeout(() => { 
                  window.location.href = '/'; 
                }, 2000);
              }
            </script>
          </body>
        </html>
      `);

    } catch (err: any) {
      console.error("Yandex Callback Error:", err);
      res.status(500).send("Ошибка при входе через Яндекс ID: " + (err?.message || "Unknown error"));
    }
  });

  // API Routes
  app.post("/api/ai/synthesis", async (req, res) => {
    try {
      const { testResult, card, quote } = req.body;
      if (!testResult || !card) {
        return res.status(400).json({ error: "Missing test result or card" });
      }

      const prompt = `Ты - эмпатичный и мудрый персональный советник (ассистент) в приложении для психологической поддержки "Внутренний компас".
Задача: Провести краткий, глубокий и вдохновляющий синтез между текущим состоянием пользователя (по результатам теста) и его Метафорической картой дня.

Входные данные:
- Текущее состояние пользователя: "${testResult.title}" (${testResult.headline})
- Описание состояния: ${testResult.description}
- Карта дня пользователя: "${card.title}"
- Послание карты: "${card.message}"
- Цитата дня (опционально): "${quote?.text || ''}"

Сформируй персональное напутствие (2-3 небольших абзаца). 
1. Подчеркни связь между эмоциональным состоянием и смыслом карты. 
2. Дай мягкий, поддерживающий совет на сегодняшний день.
Твой тон должен быть теплым, заботливым, без лишней эзотерики, но с глубоким пониманием психологии. Обращайся на "ты". Не используй приветствия, сразу переходи к сути. Форматируй текст чисто (без markdown-звездочек, используй обычные абзацы).`;

      let synthesisText = "";

      // 1. Try DeepSeek API if available
      const deepseekKey = process.env.DEEPSEEK_API_KEY;
      if (deepseekKey) {
        try {
          const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${deepseekKey}`,
            },
            body: JSON.stringify({
              model: process.env.DEEPSEEK_MODEL || "deepseek-chat",
              messages: [{ role: "user", content: prompt }]
            }),
          });
          if (deepseekResponse.ok) {
            const responseData = await deepseekResponse.json();
            synthesisText = responseData.choices?.[0]?.message?.content || "";
          }
        } catch (err) {
          console.warn("DeepSeek synthesis failed, trying fallback...", err);
        }
      }

      // 2. Try Gemini API if text is still empty and GEMINI_API_KEY is available
      const geminiKey = process.env.GEMINI_API_KEY;
      if (!synthesisText && geminiKey) {
        try {
          const ai = new GoogleGenAI({ apiKey: geminiKey });
          const modelsToTry = ["gemini-3.6-flash", "gemini-3.5-flash", "gemini-flash-latest"];
          for (const m of modelsToTry) {
            try {
              const resGen = await ai.models.generateContent({
                model: m,
                contents: prompt
              });
              if (resGen.text) {
                synthesisText = resGen.text;
                break;
              }
            } catch (mErr) {
              console.warn(`Gemini model ${m} failed:`, mErr);
            }
          }
        } catch (err) {
          console.warn("Gemini synthesis failed, using local generator...", err);
        }
      }

      // 3. Fallback generator if AI APIs are not available or failed
      if (!synthesisText) {
        synthesisText = `Ваше текущее состояние «${testResult.title}» перекликается с картой дня «${card.title}».\n\n` +
          `Карта напоминает: «${card.message}». Когда мы проживаем эмоцию «${testResult.headline.toLowerCase()}», очень важно давать себе время осознать внутренние импульсы и не спешить с выводами.\n\n` +
          `Позвольте себе сегодня побыть в контакте с собой. Сделайте глубокий вдох, используйте рекомендуемое аромамасло для гармонизации и прислушайтесь к вашему внутреннему компасу.`;
      }

      res.json({ result: synthesisText });
    } catch (error: any) {
      console.error("Synthesis error:", error);
      res.status(500).json({ error: "Failed to generate synthesis: " + (error?.message || "Unknown error") });
    }
  });

  // Гибридный движок рекомендации: правила → шорт-лист → LLM (DeepSeek → Gemini)
  // → строгий JSON. Возвращает объект по схеме, которую ждёт compassService.
  app.post("/api/ai/recommendation", async (req, res) => {
    try {
      const { microInput, plutchikProfile, emotionalHistory, context } = req.body;
      if (!microInput || typeof microInput !== "string") {
        return res.status(400).json({ error: "Missing microInput" });
      }

      const baseline = plutchikProfile?.baseline || DEFAULT_PLUTCHIK;
      const { vector, dominant } = inferEmotionState(microInput, baseline);

      const hour = typeof context?.hour === "number" ? context.hour : new Date().getHours();
      const feedback = buildFeedbackEntries(emotionalHistory);
      const shortlist = candidateShortlist({ vector, hour, feedback, dominant });

      const selection = await selectOilWithLLM(shortlist, microInput, EMOTION_LABELS[dominant]);
      const chosen =
        selection && shortlist.some((o) => o.id === selection.oilId)
          ? shortlist.find((o) => o.id === selection.oilId)!
          : shortlist[0];

      res.json({
        result: {
          plutchikInferred: vector,
          dominant,
          aroma: chosen.name,
          aromaId: chosen.id,
          aromaReason: selection?.aromaReason || defaultAromaReason(chosen, EMOTION_LABELS[dominant]),
          insight: selection?.insight || defaultInsight(chosen),
        },
      });
    } catch (error: any) {
      console.error("Recommendation error:", error);
      res.status(500).json({ error: "Failed to generate recommendation: " + (error?.message || "Unknown error") });
    }
  });

  // STT (голос → текст). Провайдер — Yandex SpeechKit (sync :recognize).
  // Ключ-гейтед: без YANDEX_SPEECHKIT_API_KEY возвращает 503, клиент показывает
  // мягкую заглушку «голос недоступен». Аудио приходит base64 из MediaRecorder.
  app.post("/api/stt", async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body || {};
      if (!audioBase64 || typeof audioBase64 !== "string") {
        return res.status(400).json({ error: "Missing audioBase64" });
      }

      const apiKey = process.env.YANDEX_SPEECHKIT_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: "STT not configured", configured: false });
      }

      const folderId = process.env.YANDEX_CLOUD_FOLDER_ID;
      const audioBuffer = Buffer.from(audioBase64, "base64");

      const response = await fetch("https://stt.api.cloud.yandex.net/speech/v1/stt:recognize", {
        method: "POST",
        headers: {
          Authorization: `Api-Key ${apiKey}`,
          ...(folderId ? { "x-folder-id": folderId } : {}),
          "Content-Type": mimeType || "audio/ogg",
        },
        body: audioBuffer,
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("SpeechKit error:", data);
        return res.status(502).json({ error: "SpeechKit request failed", details: data });
      }

      res.json({ text: (data && typeof data.result === "string" ? data.result : "") || "" });
    } catch (error: any) {
      console.error("STT error:", error);
      res.status(500).json({ error: "STT failed: " + (error?.message || "Unknown error") });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
