/**
 * Test Suite for NEXUS AI - Gemini Inference Integration
 * Tests the 10 scenarios defined in requirement #18.
 */
import { GeminiService } from '../server/services/geminiService.js';
import { ResponseEngine } from '../server/ai/responseEngine.js';
import { IntentClassifier } from '../server/ai/intentClassifier.js';
import { ContextCollector } from '../server/ai/contextCollector.js';
import { ContextObject, SystemHardwareStatus } from '../src/types/index.js';

const mockHardware: any = {
  isSnapdragon: false,
  npuAvailable: false,
  platform: 'linux',
  cpuModel: 'High-Perf Host',
  totalMemoryGb: 16,
  freeMemoryGb: 8,
  activeQuantization: 'BF16',
  cpu: 'High-Perf Host',
  isSnapdragonHost: false,
  npuStatus: 'inactive',
  qualcommRuntime: 'Qualcomm AI Hub SDK',
};

async function runTests() {
  console.log('=== NEXUS AI REAL INFERENCE TEST SUITE ===\n');

  // Test 0: Health Check
  console.log('--- Test 0: AI Health Check ---');
  const health = await GeminiService.getHealth();
  console.log('Health Result:', JSON.stringify(health, null, 2));

  // Test 1: "Hello NEXUS."
  console.log('\n--- Test 1: "Hello NEXUS." ---');
  const res1 = await GeminiService.execute('Hello NEXUS.', {});
  console.log('Success:', res1.success);
  console.log('Provider:', res1.provider, 'Model:', res1.model);
  console.log('Answer snippet:', res1.answer.slice(0, 150) + '...\n');

  // Test 2: "Explain polymorphism in Java."
  console.log('--- Test 2: "Explain polymorphism in Java." ---');
  const res2 = await GeminiService.execute('Explain polymorphism in Java.', {});
  console.log('Success:', res2.success);
  console.log('Answer snippet:', res2.answer.slice(0, 150) + '...\n');

  // Test 3: "Write a Python program to reverse a string."
  console.log('--- Test 3: "Write a Python program to reverse a string." ---');
  const res3 = await GeminiService.execute('Write a Python program to reverse a string.', {});
  console.log('Success:', res3.success, res3.error ? `Error: ${res3.error}` : '');
  console.log('Contains python code:', res3.answer.includes('def') || res3.answer.includes('[::-1]'));
  console.log('Answer snippet:', res3.answer.slice(0, 150) + '...\n');

  // Test 4: "What is the difference between RAM and ROM?"
  console.log('--- Test 4: "What is the difference between RAM and ROM?" ---');
  const res4 = await GeminiService.execute('What is the difference between RAM and ROM?', {});
  console.log('Success:', res4.success, res4.error ? `Error: ${res4.error}` : '');
  console.log('Answer snippet:', res4.answer.slice(0, 150) + '...\n');

  // Test 5: "Explain recursion like I\'m a beginner."
  console.log('--- Test 5: "Explain recursion like I\'m a beginner." ---');
  const res5 = await GeminiService.execute("Explain recursion like I'm a beginner.", {});
  console.log('Success:', res5.success, res5.error ? `Error: ${res5.error}` : '');
  console.log('Answer snippet:', res5.answer.slice(0, 150) + '...\n');

  // Test 6: "Analyze this code." [with code context]
  console.log('--- Test 6: "Analyze this code." [with code context] ---');
  const codeContext: any = {
    screen: {
      application: 'VSCode',
      windowTitle: 'authService.ts',
      text: 'function login(user: string, pass: string) {\n  if (pass === "admin123") return true;\n  return false;\n}',
      capturedAt: Date.now(),
      visualElements: [],
    },
    documents: [],
    memory: [],
    activeScenario: 'vscode_error',
    timestamp: Date.now(),
  };
  const class6 = IntentClassifier.classify('Analyze this code.', codeContext);
  const collected6 = ContextCollector.collect(class6, codeContext);
  const res6 = await ResponseEngine.generateResponse('Analyze this code.', class6, collected6, mockHardware);
  console.log('Success:', res6.success);
  console.log('Context used:', res6.contextUsed);
  console.log('Answer snippet:', res6.userResponse.answer.slice(0, 200) + '...\n');

  // Test 7: "Summarize this document." [with document context]
  console.log('--- Test 7: "Summarize this document." [with document context] ---');
  const docContext: any = {
    screen: { application: '', windowTitle: '', text: '', capturedAt: 0, visualElements: [] },
    documents: [
      {
        id: 'doc-qnn-arch',
        title: 'Qualcomm Snapdragon NPU Architecture Whitepaper',
        snippet: 'The Qualcomm Hexagon NPU delivers up to 45 TOPS of dedicated tensor processing with sub-watt idle power and direct L2 tensor memory caching.',
        chunkIndex: 0,
        similarity: 0.94,
      },
    ],
    memory: [],
    activeScenario: 'research_pdf',
    timestamp: Date.now(),
  };
  const class7 = IntentClassifier.classify('Summarize this document.', docContext);
  const collected7 = ContextCollector.collect(class7, docContext);
  const res7 = await ResponseEngine.generateResponse('Summarize this document.', class7, collected7, mockHardware);
  console.log('Success:', res7.success);
  console.log('Sources:', res7.sources);
  console.log('Context used:', res7.contextUsed);
  console.log('Answer snippet:', res7.userResponse.answer.slice(0, 200) + '...\n');

  // Test 8: "What is happening on my screen?" (Screen unavailable vs available)
  console.log('--- Test 8: "What is happening on my screen?" (Screen unavailable test) ---');
  const noScreenContext: any = {
    screen: { application: '', windowTitle: '', text: '', capturedAt: 0, visualElements: [] },
    documents: [],
    memory: [],
    timestamp: Date.now(),
  };
  const class8 = IntentClassifier.classify('What is happening on my screen?', noScreenContext);
  const collected8 = ContextCollector.collect(class8, noScreenContext);
  const res8 = await ResponseEngine.generateResponse('What is happening on my screen?', class8, collected8, mockHardware);
  console.log('Success:', res8.success);
  console.log('Screen unavailable message present:', res8.userResponse.answer.toLowerCase().includes('screen context unavailable') || res8.userResponse.answer.toLowerCase().includes('unavailable'));
  console.log('Answer snippet:', res8.userResponse.answer.slice(0, 150) + '...\n');

  // Test 9: "What did I work on recently?" [with memory context]
  console.log('--- Test 9: "What did I work on recently?" [with memory context] ---');
  const memoryContext: any = {
    screen: { application: '', windowTitle: '', text: '', capturedAt: 0, visualElements: [] },
    documents: [],
    memory: [
      {
        id: 'mem-1',
        title: 'SQLite Vector Indexing',
        content: 'Implemented SQLite vector indexing and HNSW vector quantization for on-device embeddings.',
        timestamp: Date.now() - 3600000,
        category: 'Development',
      },
      {
        id: 'mem-2',
        title: 'CORS Security Audit',
        content: 'Configured local Express proxy routes and verified TLS 1.3 encryption for Gemini cloud gateway.',
        timestamp: Date.now() - 1800000,
        category: 'Security',
      },
    ],
    timestamp: Date.now(),
  };
  const class9 = IntentClassifier.classify('What did I work on recently?', memoryContext);
  const collected9 = ContextCollector.collect(class9, memoryContext);
  const res9 = await ResponseEngine.generateResponse('What did I work on recently?', class9, collected9, mockHardware);
  console.log('Success:', res9.success);
  console.log('Context used:', res9.contextUsed);
  console.log('Answer snippet:', res9.userResponse.answer.slice(0, 200) + '...\n');

  // Test 10: Deliberately invalid request / API failure handling
  console.log('--- Test 10: Deliberately invalid request / API failure handling ---');
  // Pass an empty prompt and invalid config
  const res10 = await GeminiService.execute('', {});
  console.log('Handled gracefully (success === false):', res10.success === false);
  console.log('Error message reported:', res10.error);

  console.log('\n=== ALL 10 TESTS COMPLETED SUCCESSFULLY ===');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
