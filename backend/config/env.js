const path = require('path');

module.exports = function loadEnv() {
  require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });
  // Basic validation
  if (!process.env.MONGO_URI) {
    console.warn('Warning: MONGO_URI not set. Use .env or .env.example to configure.');
  }
};
