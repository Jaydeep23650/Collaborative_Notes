const http = require('http');

// Test the server endpoints
async function testServer() {
  console.log('🧪 Testing server endpoints...\n');
  
  const baseUrl = 'http://localhost:5001';
  
  // Test health endpoint
  try {
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    if (healthResponse.ok) {
      const healthData = await healthResponse.json();
      console.log('✅ Health check passed:', healthData.status);
      console.log('   MongoDB:', healthData.mongooseConnection);
      console.log('   Active connections:', healthData.activeConnections);
    } else {
      console.log('❌ Health check failed:', healthResponse.status);
    }
  } catch (error) {
    console.log('❌ Health check error:', error.message);
  }
  
  // Test create note endpoint
  try {
    console.log('\n2. Testing create note endpoint...');
    const createResponse = await fetch(`${baseUrl}/notes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title: 'Test Note ' + Date.now() }),
    });
    
    if (createResponse.ok) {
      const noteData = await createResponse.json();
      console.log('✅ Note created successfully:', noteData._id);
      console.log('   Title:', noteData.title);
      
      // Test fetch note endpoint
      console.log('\n3. Testing fetch note endpoint...');
      const fetchResponse = await fetch(`${baseUrl}/notes/${noteData._id}`);
      if (fetchResponse.ok) {
        const fetchedNote = await fetchResponse.json();
        console.log('✅ Note fetched successfully:', fetchedNote._id);
        console.log('   Title:', fetchedNote.title);
        console.log('   Content:', fetchedNote.content || '(empty)');
      } else {
        console.log('❌ Fetch note failed:', fetchResponse.status);
      }
    } else {
      console.log('❌ Create note failed:', createResponse.status);
    }
  } catch (error) {
    console.log('❌ Create note error:', error.message);
  }
  
  console.log('\n🏁 Test completed!');
}

// Run the test
testServer().catch(console.error);
