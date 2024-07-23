"use strict";

// ライブラリのインポート
const express = require("express");
const line = require("@line/bot-sdk");
require("dotenv").config();
const OpenAiClass = require("./openai");
const session = require("express-session");
// const { TableClient, AzureNamedKeyCredential } = require("@azure/data-tables");

const app = express();

app.use(session({
    secret: process.env.SESSION_SECRET, // セッションIDの署名に使う秘密鍵
    resave: false, // セッションが変更されなくても毎回保存するかどうか
    saveUninitialized: true, // 新規セッションを初期化するかどうか
    cookie: { secure: process.env.COOKIE || false } // 開発環境ではfalse。本番環境ではtrueに設定し、httpsを利用。
}));

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.messagingApi.MessagingApiClient({
    channelAccessToken: config.channelAccessToken,
});

// const tableClient = new TableClient(
//     `https://${process.env.AZURE_STORAGE_ACCOUNT_NAME}.table.core.windows.net`,
//     tableName,
//     new AzureNamedKeyCredential(process.env.AZURE_STORAGE_ACCOUNT_NAME, process.env.AZURE_STORAGE_ACCOUNT_KEY)
// );

// Webhook応答
app.use("/webhook", line.middleware(config));
app.post("/webhook", (req, res) => {
    Promise.all(req.body.events.map(event => handleEvent(event, req.session))).then((result) =>
        res.json(result)
    );
});

//----------------------------------------------------------
//イベント処理
//----------------------------------------------------------
async function handleEvent(event, session) {
    if (event.type !== "message" || event.message.type !== "text") {
        return Promise.resolve(null);
    }

    // セッションにAPIキーを保存
    if (!session.openaiApiKey) {
        session.openaiApiKey = process.env.OPENAI_API_KEY;
    }

    // セッションに会話ログを保持
    if (!session.conversationHistory) {
        session.conversationHistory = [];
    }

    let message = event.message.text.toLowerCase();

    // リセットメッセージ処理
    if (message === "[リセット]") {
        session.conversationHistory = [];
        return client.replyMessage({
            replyToken: event.replyToken,
            messages: [
                {
                    type: "text",
                    text: "会話ログがリセットされました。",
                },
            ],
        });
    }
    // システムメッセージ処理
    if (message === "[使い方]" ||message === "[準備中]") {
        return Promise.resolve(null);
    }

    // 会話ログにユーザーメッセージを追加
    session.conversationHistory.push({ role: "user", content: event.message.text });
    console.log(...session.conversationHistory)
    // GPT呼び出し
    const openaiInstance = new OpenAiClass(session.openaiApiKey);
    let aiResponse;
    try {
        aiResponse = await openaiInstance.main(session.conversationHistory);
    } catch (error) {
        aiResponse = "Error processing your request.";
    }

    // 会話ログにAIの応答を追加
    session.conversationHistory.push({ role: "assistant", content: aiResponse });

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