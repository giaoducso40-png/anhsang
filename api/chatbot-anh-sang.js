// api/chatbot-anh-sang.js
// Backend/proxy cho chatbot AI chủ đề Ánh sáng KHTN 9.
// KHÔNG đặt API key trong index.html. Hãy đặt OPENAI_API_KEY trong Vercel Environment Variables.

const OPENAI_API_URL = "https://api.openai.com/v1/responses";
const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4.1-mini";

const SYSTEM_PROMPT = `Bạn là Trợ lý Ánh Sáng của cô Lan Anh, hỗ trợ học sinh lớp 9 học chủ đề Ánh sáng trong môn Khoa học tự nhiên 9, bộ Kết nối tri thức.

Chỉ trả lời trong phạm vi:
- Khúc xạ ánh sáng
- Phản xạ toàn phần
- Lăng kính
- Thấu kính
- Ảnh qua thấu kính
- Đo tiêu cự thấu kính hội tụ
- Kính lúp
- Bài tập thấu kính
- Tổng ôn chủ đề ánh sáng

Nếu câu hỏi ngoài phạm vi, hãy từ chối nhẹ nhàng, dí dỏm và hướng học sinh quay lại chủ đề Ánh sáng.
Giải thích ngắn gọn, trực quan, dễ hiểu, có ví dụ đời sống, khuyến khích học sinh tự suy nghĩ.
Không làm thay toàn bộ bài nếu học sinh chưa thử; hãy gợi ý từng bước.`;

function setCorsHeaders(req, res) {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
}

function getRequestBody(req) {
  if (!req.body) return {};
  if (typeof req.body === "string") {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }
  return req.body;
}

function extractOutputText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  if (Array.isArray(data.output)) {
    const parts = [];
    for (const item of data.output) {
      if (Array.isArray(item.content)) {
        for (const content of item.content) {
          if (typeof content.text === "string") parts.push(content.text);
          if (typeof content.output_text === "string") parts.push(content.output_text);
        }
      }
    }
    const joined = parts.join("\n").trim();
    if (joined) return joined;
  }

  return "Mình chưa tạo được câu trả lời phù hợp. Em thử hỏi lại ngắn gọn hơn nhé!";
}

module.exports = async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ reply: "Endpoint này chỉ nhận phương thức POST." });
  }

  const apiKey = process.env.OPENAI_API_KEY || process.env.APITCHATBOT;
  if (!apiKey) {
    return res.status(500).json({
      reply: "Chưa cấu hình OPENAI_API_KEY trên Vercel. Thầy/cô vui lòng thêm Environment Variable rồi Redeploy."
    });
  }

  const body = getRequestBody(req);
  const message = String(body.message || "").trim();
  const profile = body.profile || {};
  const scope = body.scope || "KHTN 9 - Kết nối tri thức - Chủ đề Ánh sáng";

  if (!message) {
    return res.status(400).json({ reply: "Em hãy nhập câu hỏi trước nhé!" });
  }

  try {
    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        input: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: `Thông tin người dùng: ${JSON.stringify(profile)}\nPhạm vi: ${scope}\n\nCâu hỏi:\n${message}`
          }
        ],
        temperature: 0.45,
        max_output_tokens: 700
      })
    });

    const data = await openaiResponse.json();

    if (!openaiResponse.ok) {
      console.error("OpenAI API error:", data);
      return res.status(500).json({
        reply: "Trợ lý đang bị nhiễu tia sáng một chút 😅 Thầy/cô kiểm tra API key, model hoặc hạn mức OpenAI rồi thử lại nhé."
      });
    }

    return res.status(200).json({ reply: extractOutputText(data) });
  } catch (error) {
    console.error("Chatbot backend error:", error);
    return res.status(500).json({
      reply: "Hic, đường truyền tới Trợ lý Ánh Sáng đang chập chờn. Em thử lại sau nhé!"
    });
  }
};
