// Simple test for the in-transit stock API
const testInTransitAPI = async () => {
  try {
    const response = await fetch('http://localhost:7000/api/reports/inventory/in-transit-stock?warehouse=All%20Stores&userId=test@example.com&locCode=858');
    
    if (!response.ok) {
      console.error('API Error:', response.status, response.statusText);
      const text = await response.text();
      console.error('Response:', text);
      return;
    }
    
    const data = await response.json();
    console.log('✅ API Response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Test Error:', error.message);
  }
};

// Run the test
testInTransitAPI();