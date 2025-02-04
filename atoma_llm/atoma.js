const dotenv = require("dotenv");
const { AtomaSDK } = require("atoma-sdk");

dotenv.config();

const atomaSDK = new AtomaSDK({
    bearerAuth: process.env.ATOMASDK_BEARER_AUTH || "",
  });

async function run() {
  const completion = await atomaSDK.chat.create({
    messages: [
      {"role": "developer", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Hello!"}
    ],
    model: "deepseek-ai/DeepSeek-R1"
  });

  console.log(completion.choices[0]);
}

run();