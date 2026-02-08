const { TelegramClient } = require("telegram");
const { StringSession } = require("telegram/sessions");
const express = require("express");
const app = express();

const apiId = parseInt(process.env.TG_API_ID);
const apiHash = process.env.TG_API_HASH;
const stringSession = new StringSession(process.env.TG_SESSION);
const channelId = process.env.TG_CHANNEL_ID; // ID закрытого канала (число)

const client = new TelegramClient(stringSession, apiId, apiHash, {});

app.get("/get-stats", async (req, res) => {
    const msgId = parseInt(req.query.id);
    if (!msgId) return res.status(400).send("No ID provided");

    try {
        if (!client.connected) await client.connect();
        
        // Получаем массив сообщений (в нашем случае одно)
        const result = await client.getMessages(channelId, { ids: [msgId] });
        const msg = result[0];

        if (!msg) return res.status(404).send("Message not found");

        // Парсинг реакций в плоский формат
        const reactions = {};
        if (msg.reactions && msg.reactions.results) {
            msg.reactions.results.forEach(r => {
                const emoticon = r.reaction.emoticon || "custom";
                reactions[emoticon] = r.count;
            });
        }

        res.json({
            views: msg.views || 0,
            forwards: msg.forwards || 0,
            reactions: reactions
        });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(process.env.PORT || 3000);
