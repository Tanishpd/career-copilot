const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testModels() {
  const models = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash', 'models/gemini-pro'];
  
  for (const modelName of models) {
    try {
      console.log(`\nTesting model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent('Hello');
      const response = await result.response;
      const text = response.text();
      console.log(`✅ ${modelName} works!`);
      console.log(`   Response: ${text.substring(0, 50)}...`);
      break; // If one works, use it
    } catch (error) {
      console.log(`❌ ${modelName} failed: ${error.message.substring(0, 100)}`);
    }
  }
}

testModels().catch(console.error);
