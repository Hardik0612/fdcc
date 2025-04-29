// Netlify serverless function to handle messages API
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
// In a real project, you'd store these in environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

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
      if (supabaseUrl && supabaseKey) {
        // Use Supabase if configured
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ messages: data })
        };
      } else {
        // Use fallback if Supabase not configured
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({ messages: fallbackMessages })
        };
      }
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
      
      if (supabaseUrl && supabaseKey) {
        // Use Supabase if configured
        const { data: insertedData, error } = await supabase
          .from('messages')
          .insert([{ content: data.content }])
          .select();
          
        if (error) throw error;
        
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ message: 'Message added', data: insertedData[0] })
        };
      } else {
        // Use fallback if Supabase not configured
        fallbackMessages.unshift(newMessage);
        return {
          statusCode: 201,
          headers,
          body: JSON.stringify({ message: 'Message added', data: newMessage })
        };
      }
    }
    
    // DELETE: Clear all messages
    if (event.httpMethod === 'DELETE') {
      if (supabaseUrl && supabaseKey) {
        // Use Supabase if configured
        const { error } = await supabase
          .from('messages')
          .delete()
          .gt('id', 0);
          
        if (error) throw error;
      } else {
        // Use fallback if Supabase not configured
        fallbackMessages = [];
      }
      
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