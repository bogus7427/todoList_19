const { createServer } = require("node:http");
const { readFile } = require("node:fs/promises");
const path = require("node:path");

const PORT = Number(process.env.PORT) || 3000;
const HOST = "127.0.0.1";
const MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const MAX_BODY_BYTES = 512 * 1024;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_REPLY_LENGTH = 10000;
const ROOT = __dirname;

const staticFiles = new Map([
  ["/", ["index.html", "text/html; charset=utf-8"]],
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/css/style.css", ["css/style.css", "text/css; charset=utf-8"]],
]);

function sendJson(response, statusCode, data) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
  });
  response.end(JSON.stringify(data));
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;

  for await (const chunk of request) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      const error = new Error("요청 본문이 너무 큽니다.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    const error = new Error("올바른 JSON 요청이 아닙니다.");
    error.statusCode = 400;
    throw error;
  }
}

function validateMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return false;
  }

  return messages.every(
    (message, index) =>
      message &&
      message.role === (index % 2 === 0 ? "user" : "model") &&
      typeof message.text === "string" &&
      message.text.trim().length > 0 &&
      message.text.length <=
        (message.role === "user" ? MAX_MESSAGE_LENGTH : MAX_REPLY_LENGTH),
  ) && messages[messages.length - 1].role === "user";
}

async function handleChat(request, response) {
  if (!process.env.GEMINI_API_KEY) {
    sendJson(response, 503, {
      error: "서버에 GEMINI_API_KEY를 설정한 뒤 다시 시작해 주세요.",
    });
    return;
  }

  let body;
  try {
    body = await readJsonBody(request);
  } catch (error) {
    sendJson(response, error.statusCode || 400, { error: error.message });
    return;
  }

  if (!body || !validateMessages(body.messages)) {
    sendJson(response, 400, { error: "대화 내용이 올바르지 않습니다." });
    return;
  }

  let geminiResponse;
  try {
    geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(MODEL)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY,
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: "You are GeminiBot, a helpful and friendly assistant. Reply in Korean unless the user writes in another language. Keep answers clear and concise.",
              },
            ],
          },
          contents: body.messages.map((message) => ({
            role: message.role,
            parts: [{ text: message.text }],
          })),
          generationConfig: { maxOutputTokens: 1024 },
        }),
        signal: AbortSignal.timeout(60000),
      },
    );
  } catch (error) {
    console.error("Gemini API 연결에 실패했습니다.", error);
    sendJson(response, 502, {
      error: "Gemini API에 연결하지 못했어요. 네트워크를 확인하고 다시 시도해 주세요.",
    });
    return;
  }

  if (!geminiResponse.ok) {
    console.error(`Gemini API가 HTTP ${geminiResponse.status}를 반환했습니다.`);
    sendJson(response, 502, {
      error: "Gemini API 요청이 실패했어요. API 키와 사용량 설정을 확인해 주세요.",
    });
    return;
  }

  let data;
  try {
    data = await geminiResponse.json();
  } catch (error) {
    console.error("Gemini API 응답을 읽지 못했습니다.", error);
    sendJson(response, 502, { error: "Gemini 응답을 읽지 못했어요. 다시 시도해 주세요." });
    return;
  }

  const reply = data.candidates?.[0]?.content?.parts
    ?.map((part) => part.text || "")
    .join("")
    .trim();

  if (!reply) {
    sendJson(response, 502, { error: "Gemini가 답변을 반환하지 않았어요. 다시 시도해 주세요." });
    return;
  }

  sendJson(response, 200, { reply });
}

const server = createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${HOST}:${PORT}`);

  if (request.method === "POST" && requestUrl.pathname === "/api/chat") {
    await handleChat(request, response);
    return;
  }

  if (request.method === "GET" && staticFiles.has(requestUrl.pathname)) {
    const [fileName, contentType] = staticFiles.get(requestUrl.pathname);
    try {
      const content = await readFile(path.join(ROOT, fileName));
      response.writeHead(200, {
        "Content-Type": contentType,
        "X-Content-Type-Options": "nosniff",
      });
      response.end(content);
    } catch (error) {
      console.error(`정적 파일을 읽지 못했습니다: ${fileName}`, error);
      sendJson(response, 500, { error: "페이지 파일을 읽지 못했습니다." });
    }
    return;
  }

  sendJson(response, 404, { error: "요청한 주소를 찾을 수 없습니다." });
});

server.listen(PORT, HOST, () => {
  console.log(`GeminiBot is running at http://${HOST}:${PORT}`);
});
