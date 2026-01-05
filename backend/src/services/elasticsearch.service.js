const { getElasticsearch } = require("../config/elasticsearch.config");

class ElasticsearchService {
  constructor() {
    this.indexName = "users";
  }

  // Index a user document
  async indexUser(user) {
    try {
      const client = getElasticsearch();

      await client.index({
        index: this.indexName,
        id: user.id,
        document: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          status: user.status,
          provider: user.provider,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
        refresh: true, // Make document immediately searchable
      });

      console.log(`✅ Indexed user: ${user.id}`);
    } catch (error) {
      console.error("❌ Error indexing user:", error);
      throw error;
    }
  }

  // Update a user document
  async updateUser(userId, updateData) {
    try {
      const client = getElasticsearch();

      await client.update({
        index: this.indexName,
        id: userId,
        doc: {
          ...updateData,
          updatedAt: new Date().toISOString(),
        },
        refresh: true,
      });

      console.log(`✅ Updated user in ES: ${userId}`);
    } catch (error) {
      console.error("❌ Error updating user:", error);
      throw error;
    }
  }

  // Delete a user document
  async deleteUser(userId) {
    try {
      const client = getElasticsearch();

      await client.delete({
        index: this.indexName,
        id: userId,
        refresh: true,
      });

      console.log(`✅ Deleted user from ES: ${userId}`);
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        console.log(`⏭️  User not found in ES: ${userId}`);
        return;
      }
      console.error("❌ Error deleting user:", error);
      throw error;
    }
  }

  // Search users
  async searchUsers(searchTerm, page = 1, limit = 20, filters = {}) {
    try {
      const client = getElasticsearch();
      const from = (page - 1) * limit;

      // Build query
      const mustQueries = [];
      const shouldQueries = [];

      // Search term
      if (searchTerm && searchTerm.trim()) {
        shouldQueries.push(
          { match: { fullName: { query: searchTerm, boost: 2 } } },
          { match: { email: { query: searchTerm, boost: 1.5 } } },
          { wildcard: { "fullName.keyword": `*${searchTerm}*` } },
          { wildcard: { "email.keyword": `*${searchTerm}*` } }
        );
      }

      // Filters
      if (filters.role) {
        mustQueries.push({ term: { role: filters.role } });
      }
      if (filters.status) {
        mustQueries.push({ term: { status: filters.status } });
      }
      if (filters.provider) {
        mustQueries.push({ term: { provider: filters.provider } });
      }

      // Build final query
      const query = {
        bool: {
          must: mustQueries.length > 0 ? mustQueries : [{ match_all: {} }],
          should: shouldQueries.length > 0 ? shouldQueries : undefined,
          minimum_should_match: shouldQueries.length > 0 ? 1 : undefined,
        },
      };

      const response = await client.search({
        index: this.indexName,
        from,
        size: limit,
        query,
        sort: [{ createdAt: { order: "desc" } }],
      });

      const users = response.hits.hits.map((hit) => ({
        ...hit._source,
        _score: hit._score,
      }));

      const total = response.hits.total.value;

      return { users, total };
    } catch (error) {
      console.error("❌ Error searching users:", error);
      throw error;
    }
  }

  // Bulk index users (for initial sync)
  async bulkIndexUsers(users) {
    try {
      const client = getElasticsearch();

      const operations = users.flatMap((user) => [
        { index: { _index: this.indexName, _id: user.id } },
        {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          phone: user.phone,
          role: user.role,
          status: user.status,
          provider: user.provider,
          avatar: user.avatar,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      ]);

      const response = await client.bulk({
        refresh: true,
        operations,
      });

      if (response.errors) {
        const erroredDocuments = [];
        response.items.forEach((action, i) => {
          const operation = Object.keys(action)[0];
          if (action[operation].error) {
            erroredDocuments.push({
              status: action[operation].status,
              error: action[operation].error,
              operation: operations[i * 2],
              document: operations[i * 2 + 1],
            });
          }
        });
        console.error("❌ Bulk indexing errors:", erroredDocuments);
      }

      console.log(`✅ Bulk indexed ${users.length} users`);
      return response;
    } catch (error) {
      console.error("❌ Error bulk indexing users:", error);
      throw error;
    }
  }

  // Get user by ID
  async getUserById(userId) {
    try {
      const client = getElasticsearch();

      const response = await client.get({
        index: this.indexName,
        id: userId,
      });

      return response._source;
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        return null;
      }
      console.error("❌ Error getting user:", error);
      throw error;
    }
  }

  // Get aggregations
  async getUserAggregations() {
    try {
      const client = getElasticsearch();

      const response = await client.search({
        index: this.indexName,
        size: 0,
        aggs: {
          by_role: {
            terms: { field: "role" },
          },
          by_status: {
            terms: { field: "status" },
          },
          by_provider: {
            terms: { field: "provider" },
          },
        },
      });

      return {
        byRole: response.aggregations.by_role.buckets.reduce((acc, bucket) => {
          acc[bucket.key] = bucket.doc_count;
          return acc;
        }, {}),
        byStatus: response.aggregations.by_status.buckets.reduce(
          (acc, bucket) => {
            acc[bucket.key] = bucket.doc_count;
            return acc;
          },
          {}
        ),
        byProvider: response.aggregations.by_provider.buckets.reduce(
          (acc, bucket) => {
            acc[bucket.key] = bucket.doc_count;
            return acc;
          },
          {}
        ),
        total: response.hits.total.value,
      };
    } catch (error) {
      console.error("❌ Error getting aggregations:", error);
      throw error;
    }
  }
}

module.exports = new ElasticsearchService();
