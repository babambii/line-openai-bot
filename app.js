const express = require("express");
const line = require("@line/bot-sdk");
// const ngrok = require("ngrok");
require("dotenv").config();

const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

const app = express();

const client = new line.messagingApi.MessagingApiClient({
    channelAccessToken: config.channelAccessToken,
});

app.use("/webhook", line.middleware(config));
app.post("/webhook", (req, res) => {
    Promise.all(req.body.events.map(handleEvent)).then((result) =>
    res.json(result)
    );
});

function handleEvent(event) {
    if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
    }

    return client.replyMessage({
    replyToken: event.replyToken,
    messages: [
        {
        type: "text",
        text: event.message.text,
        },
    ],
    });
}


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is listening on http://localhost:${port}`);
    });

// const port = process.env.PORT || 3000;
// app.listen(port, async () => {
//     try {
//     const ngrokUrl = await ngrok.connect(port);
//     console.log(`Ngrok URL: ${ngrokUrl}/webhook`);
//     } catch (error) {
//     console.error("Error while connecting with ngrok:", error);
//     }
// });