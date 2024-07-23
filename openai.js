"use strict";

// ライブラリのインポート
// const { Configuration, OpenAIApi } = require("openai");
const Configuration = require("openai");
const OpenAIApi = require("openai");

class OpenAiClass {
    constructor(apiKey) {
        const configuration = new Configuration({
            apiKey: apiKey,
        });
        this.openai = new OpenAIApi(configuration);
    }

    async main(conversation) {
        try {
            const completion = await this.openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    { role: "system", content: "質問に対して、簡潔に回答してください。" },
                    ...conversation,
                    // {role: 'user', content: 'あ'},
                ],
            });

            console.log(completion.choices[0].message);
            return completion.choices[0].message.content;
        } catch (error) {
            console.error("Error creating completion:", error);
            throw error;
        }
    }
}

module.exports = OpenAiClass;