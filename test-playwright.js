const { getAmazonImageWithPlaywright } = require('./server/services/playwrightExtractor.ts');

async function testPlaywright() {
  console.log('Testing Playwright extraction...');
  
  const url = 'https://www.amazon.com/Nike-Elite-All-Court-Basketball/dp/B094YTGDC2';
  const image = await getAmazonImageWithPlaywright(url);
  
  console.log('Result:', image);
}

testPlaywright().catch(console.error);
