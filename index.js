require("dotenv").config();
const express = require("express");
const axios = require("axios");
const { createClient } = require("@supabase/supabase-js");
const { readSlip } = require("./ocr");

const app = express();
app.use(express.json());

// ✅ connect supabase
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ===== webhook =====
app.post("/webhook", async (req, res) => {
  const events = req.body.events;

  for (let event of events) {
    if (event.type !== "message") continue;

    const userId = event.source.userId;

    // 📸 ถ้าเป็นรูป
    if (event.message.type === "image") {
      const imageId = event.message.id;

      const imageUrl = `https://api-data.line.me/v2/bot/message/${imageId}/content`;

      console.log("📸 รับสลิป");

      const amount = await readSlip(imageUrl);

      // 💾 save to supabase
      await supabase.from("slips").insert([
        {
          userId,
          amount,
          status: "pending"
        }
      ]);

      await reply(event.replyToken, `
✅ ได้รับสลิปแล้ว
⏳ กำลังตรวจสอบ
`);
    }

    // 💬 ถ้าเป็นข้อความ
    if (event.message.type === "text") {
      await reply(event.replyToken, "📌 กรุณาส่งสลิป");
    }
  }

  res.sendStatus(200);
});

// ===== reply =====
async function reply(token, text) {
  await axios.post(
    "https://api.line.me/v2/bot/message/reply",
    {
      replyToken: token,
      messages: [{ type: "text", text }]
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.LINE_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}

// ===== start =====
app.listen(process.env.PORT || 3000, () => {
  console.log("🚀 Server running");
});