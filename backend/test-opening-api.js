// Test the opening balance API directly
import fetch from 'node-fetch';

const baseUrl = 'http://localhost:5000';

async function testOpeningBalance() {
  console.log('🧪 Testing Opening Balance API\n');
  console.log('='.repeat(60));

  // Test case 1: Z-Edapally (locCode 144) for 2026-02-02
  const testCases = [
    { locCode: '144', date: '2026-02-02', storeName: 'Z-Edapally' },
    { locCode: '704', date: '2026-02-02', storeName: 'G.Thrissur' },
    { locCode: '706', date: '2026-02-02', storeName: 'G.Chavakkad' },
  ];

  for (const test of testCases) {
    console.log(`\n📍 Testing: ${test.storeName} (${test.locCode}) on ${test.date}`);
    console.log('-'.repeat(60));

    const url = `${baseUrl}/api/user/getsaveCashBank?locCode=${test.locCode}&date=${test.date}`;
    console.log(`URL: ${url}`);

    try {
      const response = await fetch(url);
      console.log(`Status: ${response.status} ${response.statusText}`);

      if (response.ok) {
        const data = await response.json();
        console.log('✅ SUCCESS!');
        console.log(`   Cash: ${data.data.cash}`);
        console.log(`   Closecash: ${data.data.Closecash}`);
        console.log(`   Bank: ${data.data.bank}`);
        console.log(`   Date: ${data.data.date}`);
      } else {
        const error = await response.json();
        console.log('❌ FAILED!');
        console.log(`   Error: ${error.message}`);
      }
    } catch (error) {
      console.log('❌ REQUEST FAILED!');
      console.log(`   Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('✅ Test complete!');
}

testOpeningBalance();
