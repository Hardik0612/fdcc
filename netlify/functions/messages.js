// Netlify serverless function to handle messages API
// Simple in-memory storage for demo purposes
// Note: This will reset when the function is redeployed or goes cold

// For demo purposes - use in-memory storage if Supabase is not configured
let fallbackMessages = [];

exports.handler = async function(event, context) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers
    };
  }

  // Main handler logic
  try {
    // GET: Retrieve all messages
    if (event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ messages: fallbackMessages })
      };
    }
    
    // POST: Create a new message
    if (event.httpMethod === 'POST') {
      const data = JSON.parse(event.body);
      
      if (!data.content) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Message content required' })
        };
      }
      
      const newMessage = {
        id: Date.now(),
        content: data.content,
        created_at: new Date().toISOString()
      };
      
      fallbackMessages.unshift(newMessage);
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({ message: 'Message added', data: newMessage })
      };
    }
    
    // DELETE: Clear all messages
    if (event.httpMethod === 'DELETE') {
      fallbackMessages = [];
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'All messages cleared' })
      };
    }
    
    // If we get here, the HTTP method is not supported
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
    
  } catch (error) {
    console.error('Function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Server error' })
    };
  }
};