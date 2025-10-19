import express from "express";
import { Telegraf } from "telegraf";

const BOT_TOKEN = process.env.BOT_TOKEN;
const OWNER_ID  = Number(process.env.OWNER_ID);
const BASE_URL  = process.env.BASE_URL;

if (!BOT_TOKEN) throw new Error("BOT_TOKEN is required");
if (!OWNER_ID)  throw new Error("OWNER_ID is required");
if (!BASE_URL)  throw new Error("BASE_URL is required");

const bot = new Telegraf(BOT_TOKEN);
const app = express();
const HOOK_PATH = "/tg"; // путь вебхука

app.use(express.json());
app.use(express.static("public"));
app.get("/health", (_, res) => res.send("OK"));

bot.start(async (ctx) => {
  const sku = ctx.startPayload || "";
  const url = sku ? `${BASE_URL}/?sku=${encodeURIComponent(sku)}` : `${BASE_URL}/`;
  await ctx.reply("Открыть каталог 🎁", {
    reply_markup: {
      keyboard: [[{ text: "🛍 Открыть магазин", web_app: { url } }]],
      resize_keyboard: true
    }
  });
});

bot.command("catalog", async (ctx) => {
  await ctx.reply("Каталог 🎁", {
    reply_markup: {
      keyboard: [[{ text: "🛍 Открыть магазин", web_app: { url: `${BASE_URL}/` } }]],
      resize_keyboard: true
    }
  });
});

bot.on("message", async (ctx) => {
  const msg = ctx.message;
  if (msg.web_app_data) {
    try {
      const data = JSON.parse(msg.web_app_data.data);
      const { sku, title, price, qty, customer = {}, delivery = {} } = data;

      const text =
        `🆕 *Заявка из мини-аппы*\n\n` +
        `*Товар:* ${title} (SKU: ${sku})\n` +
        `*Цена:* ${price} ₽\n` +
        `*Кол-во:* ${qty}\n\n` +
        `*Покупатель:* ${customer.name || "—"}\n` +
        `*Телефон:* ${customer.phone || "—"}\n` +
        `*Доставка:* ${delivery.method || "—"}\n` +
        (delivery.address ? `*Адрес:* ${delivery.address}\n` : "") +
        (delivery.comment ? `*Комментарий:* ${delivery.comment}\n` : "");

      await ctx.telegram.sendMessage(OWNER_ID, text, { parse_mode: "Markdown" });
      await ctx.reply("Спасибо! Заявка отправлена. Мы свяжемся с вами в ближайшее время.");
    } catch (e) {
      console.error(e);
      await ctx.reply("Ошибка обработки заявки, попробуйте ещё раз.");
    }
  }
});

// ---- режим запуска: Render = webhook, локально = polling ----
(async () => {
  if (process.env.RENDER) {
    // на Render используем вебхук
    const fullWebhookUrl = `${BASE_URL}${HOOK_PATH}`;
    await bot.telegram.setWebhook(fullWebhookUrl);
    app.post(HOOK_PATH, (req, res) => bot.handleUpdate(req.body, res));
    console.log("Webhook mode. URL:", fullWebhookUrl);
  } else {
    // локально — polling
    await bot.launch();
    console.log("Polling mode. Bot started");
  }
})();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Web server on :${PORT}`));

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
