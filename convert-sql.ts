// convert-sql.js
const fs = require('fs').promises;
const axios = require('axios');

// Default configuration
const config = {
  baseURL: process.env.API_URL || 'http://localhost:3000',
  inputFile: 'query.txt',
  outputFile: 'converted_query.txt',
};

async function generateBearerToken() {
  try {
    const response = await axios.post(`${config.baseURL}/auth/generate`);
    return response.data.token;
  } catch (error) {
    console.error(
      'Error generating bearer token:',
      error.response?.data || error.message,
    );
    throw new Error('Failed to generate bearer token');
  }
}

async function convertQuery(query, token) {
  try {
    // Encode query to base64
    const encodedQuery = Buffer.from(query, 'utf-8').toString('base64');

    // Make request to migration endpoint
    const response = await axios.post(
      `${config.baseURL}/sql-migration/convert`,
      {
        original_query: encodedQuery,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.data.success) {
      throw new Error(
        'Conversion failed: ' + (response.data.warnings || []).join(', '),
      );
    }

    // Decode the converted query
    const decodedQuery = Buffer.from(
      response.data.converted_query,
      'base64',
    ).toString('utf-8');
    return decodedQuery;
  } catch (error) {
    console.error(
      'Error converting query:',
      error.response?.data || error.message,
    );
    throw new Error('Failed to convert query');
  }
}

async function main() {
  try {
    // Read the query from file
    const query = await fs.readFile(config.inputFile, 'utf-8');
    if (!query.trim()) {
      throw new Error('Query file is empty');
    }

    // Generate bearer token
    const token = await generateBearerToken();
    console.log('Bearer token generated successfully');

    // Convert the query
    const convertedQuery = await convertQuery(query, token);
    console.log('Query converted successfully');

    // Write the result to file
    await fs.writeFile(config.outputFile, convertedQuery);
    console.log(`Converted query written to ${config.outputFile}`);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run the script
main();
