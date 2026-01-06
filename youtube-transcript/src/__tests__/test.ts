/**
 * Full Test Suite for YouTube Transcript Service
 * 
 * Run with: npx ts-node src/__tests__/test.ts
 */

import { 
  transcriptService,
  videoIdExtractor,
} from '../index';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

function test(name: string, fn: () => boolean | Promise<boolean>): void {
  try {
    const result = fn();
    if (result instanceof Promise) {
      result
        .then((passed) => {
          results.push({ name, passed });
          console.log(`${passed ? '✅' : '❌'} ${name}`);
        })
        .catch((error) => {
          results.push({ name, passed: false, error: error.message });
          console.log(`❌ ${name}: ${error.message}`);
        });
    } else {
      results.push({ name, passed: result });
      console.log(`${result ? '✅' : '❌'} ${name}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, passed: false, error: message });
    console.log(`❌ ${name}: ${message}`);
  }
}

async function runTests(): Promise<void> {
  console.log('='.repeat(60));
  console.log('YouTube Transcript - Test Suite');
  console.log('='.repeat(60));
  console.log('');

  // VideoIdExtractor tests
  console.log('📦 VideoIdExtractor Tests:');
  
  test('Extract ID from watch URL', () => {
    const id = videoIdExtractor.extract('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    return id === 'dQw4w9WgXcQ';
  });

  test('Extract ID from short URL', () => {
    const id = videoIdExtractor.extract('https://youtu.be/dQw4w9WgXcQ');
    return id === 'dQw4w9WgXcQ';
  });

  test('Extract ID from embed URL', () => {
    const id = videoIdExtractor.extract('https://www.youtube.com/embed/dQw4w9WgXcQ');
    return id === 'dQw4w9WgXcQ';
  });

  test('Extract ID from shorts URL', () => {
    const id = videoIdExtractor.extract('https://www.youtube.com/shorts/dQw4w9WgXcQ');
    return id === 'dQw4w9WgXcQ';
  });

  test('Return raw ID if already valid', () => {
    const id = videoIdExtractor.extract('dQw4w9WgXcQ');
    return id === 'dQw4w9WgXcQ';
  });

  test('Return null for invalid URL', () => {
    const id = videoIdExtractor.extract('not-a-valid-url');
    return id === null;
  });

  test('Validate correct video ID', () => {
    return videoIdExtractor.isValid('dQw4w9WgXcQ');
  });

  test('Reject invalid video ID', () => {
    return !videoIdExtractor.isValid('too-short');
  });

  console.log('');

  // TranscriptService tests
  console.log('📦 TranscriptService Tests:');

  test('Validate URL method', () => {
    const result = transcriptService.validateUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    return result.valid && result.videoId === 'dQw4w9WgXcQ';
  });

  test('Reject invalid URL', () => {
    const result = transcriptService.validateUrl('invalid');
    return !result.valid && result.error !== null;
  });

  // Async tests
  console.log('');
  console.log('📦 Integration Tests (async):');

  await test('Get transcript from real video', async () => {
    const result = await transcriptService.getTranscript(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );
    return result.success && result.transcript.length > 0;
  });

  await test('Get available languages', async () => {
    const result = await transcriptService.getAvailableLanguages(
      'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    );
    return result.success && Array.isArray(result.languages);
  });

  console.log('');
  console.log('='.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  console.log(`Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('✅ All tests passed!');
  } else {
    console.log('❌ Some tests failed');
    process.exit(1);
  }
}

runTests().catch((error) => {
  console.error('Test runner error:', error);
  process.exit(1);
});
