// src/test-llm.ts
import { LlamaChatSession, LlamaContext, LlamaModel } from 'node-llama-cpp';
import * as path from 'path';

async function testLlm() {
  try {
    console.log('Initializing model...');
    const modelConfig = {
      modelPath: path.join(
        process.cwd(),
        'models',
        'mistral-7b-instruct-v0.2.Q4_K_M.gguf',
      ),
      contextSize: 4096,
      gpuLayers: 0,
      useMlock: true,
      embedding: false,
    };

    const model = new LlamaModel(modelConfig);
    console.log('Model initialized successfully');

    console.log('Creating context...');
    const context = new LlamaContext(model);
    console.log('Context created successfully');

    console.log('Creating chat session...');
    const session = new LlamaChatSession(context);
    console.log('Chat session created successfully');

    console.log('Testing model with simple prompt...');
    const response = await session.prompt('Say "hello world"');
    console.log('Response:', response);

    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      console.error('Stack trace:', error.stack);
    }
  }
}

testLlm();
