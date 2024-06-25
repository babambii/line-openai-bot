"use strict";

// ライブラリのインポート
const express = require("express");
const line = require("@line/bot-sdk");
require("dotenv").config();
const OpenAiClass = require("./openai");
const session = require("express-session");

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET, // セッションIDの署名に使う秘密鍵
    resave: false, // セッションが変更されなくても毎回保存するかどうか
    saveUninitialized: true, // 新規セッションを初期化するかどうか
    cookie: { secure: false } // trueにするとHTTPSでのみクッキーを送信する
}));

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
    channelAccessToken: config.channelAccessToken,
});

// Webhook応答
app.use("/webhook", line.middleware(config));
app.post("/webhook", (req, res) => {
    Promise.all(req.body.events.map(event => handleEvent(event, req.session))).then((result) =>
        res.json(result)
    );
});

// イベント処理
async function handleEvent(event, session) {
    if (event.type !== "message" || event.message.type !== "text") {
        return Promise.resolve(null);
    }

    // セッションにAPIキーを保存
    if (!session.openaiApiKey) {
        session.openaiApiKey = process.env.OPENAI_API_KEY;
    }

    // GPT呼び出しテスト
    const openaiInstance = new OpenAiClass(session.openaiApiKey);
    let aiResponse;
    try {
        aiResponse = await openaiInstance.main();
    } catch (error) {
        aiResponse = "Error processing your request.";
    }

    // 返信処理
    return client.replyMessage({
    replyToken: event.replyToken,
    messages: [
        {
        type: "text",
        // text: event.message.text,
        text: aiResponse,
        },
    ],
    });
}

// Expressサーバー3000番ポートで起動
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
    });