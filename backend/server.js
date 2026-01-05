require("dotenv").config();
const { initializeFirebase } = require("./src/config/firebase.config");
const {
  initializeElasticsearch,
  createUserIndex,
  testConnection,
} = require("./src/config/elasticsearch.config");

// Initialize Firebase
initializeFirebase();

// Initialize Elasticsearch
initializeElasticsearch();

// Test connection và tạo index
(async () => {
  try {
    await testConnection();
    await createUserIndex();
  } catch (error) {
    console.error("Failed to setup Elasticsearch:", error);
  }
})();

const app = require("./src/app");
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🌐 API URL: http://localhost:${PORT}/api`);
});
