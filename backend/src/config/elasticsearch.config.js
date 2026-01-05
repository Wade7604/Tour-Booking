const { Client } = require("@elastic/elasticsearch");

let esClient = null;

const initializeElasticsearch = () => {
  try {
    const node = process.env.ELASTICSEARCH_NODE;
    const apiKey = process.env.ELASTICSEARCH_API_KEY;

    if (!node || !apiKey) {
      throw new Error(
        "Missing Elasticsearch credentials. Please check ELASTICSEARCH_NODE and ELASTICSEARCH_API_KEY in .env"
      );
    }

    esClient = new Client({
      node: node,
      auth: {
        apiKey: apiKey,
      },
      maxRetries: 5,
      requestTimeout: 60000,
      tls: {
        rejectUnauthorized: true,
      },
    });

    console.log("✅ Elasticsearch initialized with API Key");
    console.log(
      `📍 Node: ${node.split("//")[1].split(":")[0].substring(0, 20)}...`
    );

    return esClient;
  } catch (error) {
    console.error("❌ Failed to initialize Elasticsearch:", error.message);
    throw error;
  }
};

const getElasticsearch = () => {
  if (!esClient) {
    throw new Error(
      "Elasticsearch not initialized. Call initializeElasticsearch() first."
    );
  }
  return esClient;
};

const testConnection = async () => {
  try {
    const client = getElasticsearch();

    console.log("🔍 Testing Elasticsearch connection...");

    // Ping cluster
    const ping = await client.ping();
    if (!ping) {
      throw new Error("Ping failed");
    }

    // Get cluster info
    const info = await client.info();
    console.log(`✅ Connected to Elasticsearch`);
    console.log(`📊 Cluster: ${info.cluster_name}`);
    console.log(`📊 Version: ${info.version.number}`);

    // Get cluster health
    const health = await client.cluster.health();
    console.log(`📊 Status: ${health.status}`);
    console.log(`📊 Nodes: ${health.number_of_nodes}`);

    return true;
  } catch (error) {
    console.error("❌ Elasticsearch connection failed:");
    console.error(`   Error: ${error.message}`);

    if (error.meta) {
      console.error(`   Status: ${error.meta.statusCode}`);
      if (error.meta.body) {
        console.error(
          `   Details: ${JSON.stringify(error.meta.body, null, 2)}`
        );
      }
    }

    return false;
  }
};

const createUserIndex = async () => {
  try {
    const client = getElasticsearch();
    const indexName = "users";

    console.log(`🔍 Checking if index '${indexName}' exists...`);
    const exists = await client.indices.exists({ index: indexName });

    if (!exists) {
      console.log(`📝 Creating index '${indexName}'...`);

      await client.indices.create({
        index: indexName,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                custom_analyzer: {
                  type: "custom",
                  tokenizer: "standard",
                  filter: ["lowercase", "asciifolding"],
                },
              },
            },
          },
          mappings: {
            properties: {
              id: { type: "keyword" },
              email: {
                type: "text",
                analyzer: "custom_analyzer",
                fields: { keyword: { type: "keyword" } },
              },
              fullName: {
                type: "text",
                analyzer: "custom_analyzer",
                fields: { keyword: { type: "keyword" } },
              },
              phone: { type: "keyword" },
              role: { type: "keyword" },
              status: { type: "keyword" },
              provider: { type: "keyword" },
              avatar: { type: "keyword" },
              createdAt: { type: "date" },
              updatedAt: { type: "date" },
            },
          },
        },
      });

      console.log(`✅ Created Elasticsearch index: ${indexName}`);
    } else {
      console.log(`⏭️  Elasticsearch index already exists: ${indexName}`);
    }
  } catch (error) {
    console.error("❌ Error creating user index:");
    console.error(`   ${error.message}`);
    throw error;
  }
};

const deleteUserIndex = async () => {
  try {
    const client = getElasticsearch();
    const indexName = "users";

    const exists = await client.indices.exists({ index: indexName });

    if (exists) {
      await client.indices.delete({ index: indexName });
      console.log(`✅ Deleted Elasticsearch index: ${indexName}`);
    } else {
      console.log(`⏭️  Index '${indexName}' does not exist`);
    }
  } catch (error) {
    console.error("❌ Error deleting index:", error.message);
    throw error;
  }
};

module.exports = {
  initializeElasticsearch,
  getElasticsearch,
  createUserIndex,
  deleteUserIndex,
  testConnection,
};
