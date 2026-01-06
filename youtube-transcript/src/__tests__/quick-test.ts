/**
 * Quick Test for YouTube Transcript Service
 * 
 * Run with: npx ts-node src/__tests__/quick-test.ts [URL]
 */

import { transcriptService } from '../index';

const DEFAULT_VIDEO_URL = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

async function main(): Promise<void> {
  const url = process.argv[2] || DEFAULT_VIDEO_URL;

  console.log('='.repeat(60));
  console.log('YouTube Transcript Test');
  console.log('='.repeat(60));
  console.log(`\nURL: ${url}`);

  // Validate URL
  const validation = transcriptService.validateUrl(url);
  console.log(`\nValidation:`);
  console.log(`  Valid: ${validation.valid}`);
  console.log(`  Video ID: ${validation.videoId || 'N/A'}`);

  if (!validation.valid) {
    console.error(`\nError: ${validation.error}`);
    process.exit(1);
  }

  // Get transcript
  console.log('\nFetching transcript...');
  const result = await transcriptService.getTranscript(url, {
    includeTimestamps: false,
  });

  if (result.success) {
    console.log('\n✅ Success!');
    console.log(`\nLanguage: ${result.language.name} (${result.language.code})`);
    console.log(`Type: ${result.language.kind === 'asr' ? 'Auto-generated' : 'Manual'}`);
    console.log(`Available Languages: ${result.availableLanguages.length}`);
    console.log(`\nTranscript Preview (first 500 chars):`);
    console.log('-'.repeat(40));
    console.log(result.transcript.substring(0, 500) + '...');
    console.log('-'.repeat(40));
    console.log(`\nTotal length: ${result.transcript.length} characters`);
  } else {
    console.error('\n❌ Failed!');
    console.error(`Error: ${result.error}`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
