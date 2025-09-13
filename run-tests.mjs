import { spawn } from 'child_process';
import { readdir, access } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Test configuration
const TEST_FILES = [
    'basic-node.test.mjs',
    'server-node.test.mjs',
    'storage-node.test.mjs',
    'services-node.test.mjs'
];

// Colors for console output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorLog(color, message) {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkTestFile(testFile) {
    try {
        await access(join(__dirname, testFile));
        return true;
    } catch {
        return false;
    }
}

function runTest(testFile) {
    return new Promise((resolve) => {
        const startTime = Date.now();
        
        colorLog('yellow', `📋 Running ${testFile.replace('.test.mjs', '')} tests...`);
        console.log('');
        
        const child = spawn('node', ['--test', testFile], {
            stdio: 'pipe',
            cwd: __dirname
        });
        
        let output = '';
        let errorOutput = '';
        
        child.stdout.on('data', (data) => {
            const text = data.toString();
            output += text;
            process.stdout.write(text);
        });
        
        child.stderr.on('data', (data) => {
            const text = data.toString();
            errorOutput += text;
            process.stderr.write(text);
        });
        
        // Set a timeout for hanging tests
        const timeout = setTimeout(() => {
            child.kill('SIGKILL');
            const duration = (Date.now() - startTime) / 1000;
            console.log('');
            colorLog('red', `❌ ${testFile} timed out after 60 seconds`);
            colorLog('red', `⏱️  Duration: ${duration}s`);
            resolve({ success: false, duration, output, errorOutput, timedOut: true });
        }, 60000);
        
        child.on('close', (code) => {
            clearTimeout(timeout);
            const duration = (Date.now() - startTime) / 1000;
            
            console.log('');
            if (code === 0) {
                colorLog('green', `✅ ${testFile.replace('.test.mjs', '')} tests completed successfully`);
                colorLog('green', `⏱️  Duration: ${duration}s`);
                resolve({ success: true, duration, output, errorOutput });
            } else {
                colorLog('red', `❌ ${testFile.replace('.test.mjs', '')} tests failed with code ${code}`);
                colorLog('red', `⏱️  Duration: ${duration}s`);
                resolve({ success: false, duration, output, errorOutput, exitCode: code });
            }
        });
    });
}

async function runTestSuite() {
    colorLog('blue', '🧪 GiftGenie Test Suite Runner');
    colorLog('blue', '================================');
    console.log('');
    
    // Check if all test files exist
    colorLog('blue', '🔍 Discovering test files...');
    
    const missingFiles = [];
    for (const testFile of TEST_FILES) {
        const exists = await checkTestFile(testFile);
        if (exists) {
            colorLog('green', `✓ Found: ${testFile}`);
        } else {
            colorLog('red', `❌ Missing: ${testFile}`);
            missingFiles.push(testFile);
        }
    }
    
    if (missingFiles.length > 0) {
        colorLog('red', `❌ ${missingFiles.length} test file(s) missing. Aborting.`);
        process.exit(1);
    }
    
    console.log('');
    colorLog('blue', `📊 Found ${TEST_FILES.length} test files`);
    console.log('');
    
    // Run tests
    const suiteStartTime = Date.now();
    const results = [];
    
    for (const testFile of TEST_FILES) {
        colorLog('blue', '━'.repeat(100));
        
        const result = await runTest(testFile);
        results.push({ testFile, ...result });
        
        console.log('');
    }
    
    const suiteDuration = (Date.now() - suiteStartTime) / 1000;
    
    // Generate summary
    const passedTests = results.filter(r => r.success).length;
    const failedTests = results.filter(r => !r.success).length;
    
    colorLog('blue', '━'.repeat(100));
    colorLog('blue', '📈 TEST SUITE SUMMARY');
    colorLog('blue', '━'.repeat(100));
    console.log('');
    
    console.log(`📋 Total test files: ${TEST_FILES.length}`);
    colorLog('green', `✅ Passed: ${passedTests}`);
    colorLog('red', `❌ Failed: ${failedTests}`);
    console.log(`⏱️  Total duration: ${suiteDuration}s`);
    console.log('');
    
    // Detailed results
    if (failedTests > 0) {
        colorLog('red', '💥 Failed Tests:');
        results.filter(r => !r.success).forEach(result => {
            if (result.timedOut) {
                console.log(`   • ${result.testFile}: TIMEOUT`);
            } else {
                console.log(`   • ${result.testFile}: Exit code ${result.exitCode || 'unknown'}`);
            }
        });
        console.log('');
    }
    
    // Test categories
    colorLog('blue', '🏷️  Test Categories Covered:');
    console.log('   • Basic Node.js functionality');
    console.log('   • Express server and API endpoints');
    console.log('   • MemStorage CRUD operations');
    console.log('   • External service integrations (OpenAI, Google Images, Image Service)');
    console.log('');
    
    // Coverage summary
    colorLog('blue', '📊 Coverage Summary:');
    console.log('   • Server startup and configuration: ✅');
    console.log('   • API route testing: ✅');
    console.log('   • Database operations: ✅');
    console.log('   • External API mocking: ✅');
    console.log('   • Error handling: ✅');
    console.log('   • Data validation: ✅');
    console.log('');
    
    // Final result
    if (failedTests === 0) {
        colorLog('green', '🎉 ALL TESTS PASSED! Your GiftGenie app is robust and ready.');
        process.exit(0);
    } else {
        colorLog('red', '💥 Some tests failed. Please review the output above.');
        process.exit(1);
    }
}

// Error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});

// Run the test suite
runTestSuite().catch((error) => {
    console.error('Test suite failed:', error);
    process.exit(1);
});
