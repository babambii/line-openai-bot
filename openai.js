"use strict";

// ライブラリのインポート
const OpenAI = require("openai");

class OpenAiClass {
    constructor(apiKey) {
        this.openai = new OpenAI(apiKey);
    }

    async main() {
        try {
            const completion = await this.openai.chat.completions.create({
                messages: [{ role: "system", content: "親切な日本人" }],
                model: "gpt-3.5-turbo",
            });

            console.log(completion.choices[0]);
            return completion.choices[0].message.content;    
        } catch (error) {
            console.error("Error creating completion:", error);
            throw error;
        }
    }
}

module.exports = OpenAiClass;