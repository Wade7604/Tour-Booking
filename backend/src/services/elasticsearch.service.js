const { getElasticsearch } = require("../config/elasticsearch.config");

class ElasticsearchService {
  constructor() {
    this.client = null;
  }

  // Get client instance
  getClient() {
    if (!this.client) {
      this.client = getElasticsearch();
    }
    return this.client;
  }

  // ==================== TOUR METHODS ====================
  // Index a tour to Elasticsearch
  async indexTour(tour) {
    try {
      const client = this.getClient();

      await client.index({
        index: "tours",
        id: tour.id,
        document: {
          id: tour.id,
          name: tour.name,
          slug: tour.slug,
          description: tour.description,
          destinationId: tour.destinationId,
          destinations: tour.destinations || [],
          duration: tour.duration,
          price: tour.price,
          difficulty: tour.difficulty,
          tourType: tour.tourType,
          status: tour.status,
          featured: tour.featured || false,
          coverImage: tour.coverImage,
          images: tour.images || [],
          createdAt: tour.createdAt,
          updatedAt: tour.updatedAt,
        },
        refresh: true,
      });

      console.log(`✅ Indexed tour: ${tour.id}`);
    } catch (error) {
      console.error("❌ Failed to index tour:", error);
      throw error;
    }
  }

  // Update a tour in Elasticsearch
  async updateTour(tourId, updateData) {
    try {
      const client = this.getClient();

      await client.update({
        index: "tours",
        id: tourId,
        doc: {
          ...updateData,
          updatedAt: new Date().toISOString(),
        },
        refresh: true,
      });

      console.log(`✅ Updated tour in ES: ${tourId}`);
    } catch (error) {
      console.error("❌ Failed to update tour:", error);
      throw error;
    }
  }

  // Delete a tour from Elasticsearch
  async deleteTour(tourId) {
    try {
      const client = this.getClient();

      await client.delete({
        index: "tours",
        id: tourId,
        refresh: true,
      });

      console.log(`✅ Deleted tour from ES: ${tourId}`);
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        console.log(`⏭️  Tour not found in ES: ${tourId}`);
        return;
      }
      console.error("❌ Failed to delete tour:", error);
      throw error;
    }
  }

  // Search tours in Elasticsearch
  async searchTours(searchTerm, options = {}) {
    try {
      const client = this.getClient();
      const {
        page = 1,
        limit = 10,
        status,
        difficulty,
        tourType,
        destinationId,
        featured,
        minPrice,
        maxPrice,
        sortBy = "createdAt",
        sortOrder = "desc",
      } = options;

      const must = [];
      const filter = [];

      // Text search
      if (searchTerm && searchTerm.trim()) {
        must.push({
          multi_match: {
            query: searchTerm,
            fields: ["name^5", "description^2", "destinations.name^3"],
            fuzziness: "AUTO",
          },
        });
      }

      // Status filter
      if (status) {
        filter.push({ term: { status: status } });
      }

      // Difficulty filter (handles multiple values)
      if (difficulty) {
        const diffs = difficulty.split(",");
        filter.push({ terms: { difficulty: diffs } });
      }

      // Tour Type filter (handles multiple values)
      if (tourType) {
        const types = tourType.split(",");
        filter.push({ terms: { tourType: types } });
      }

      // Destination filter
      if (destinationId) {
        filter.push({ term: { destinationId: destinationId } });
      }

      // Featured filter
      if (featured !== undefined) {
        filter.push({ term: { featured } });
      }

      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        const range = {};
        if (minPrice !== undefined) range.gte = minPrice;
        if (maxPrice !== undefined) range.lte = maxPrice;
        filter.push({ range: { "price.adult": range } });
      }

      const from = (page - 1) * limit;

      let sortField = sortBy;
      if (sortBy === 'price') {
        sortField = 'price.adult';
      } else if (sortBy === 'name') {
        sortField = 'name.keyword';
      }

      const queryBody = {
        index: "tours",
        from,
        size: limit,
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
            filter: filter,
          },
        },
        sort: [
          { [sortField]: { order: sortOrder } }
        ],
      };

      console.log("🔍 ES Search Query:", JSON.stringify(queryBody, null, 2));
      const response = await client.search(queryBody);

      const tours = response.hits.hits.map((hit) => hit._source);
      const total = response.hits.total.value;

      return {
        tours,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      console.error("❌ Elasticsearch tour search failed:", error.message);
      if (error.meta) {
        if (error.meta.body) {
           console.error("   ES Error Body:", JSON.stringify(error.meta.body, null, 2));
        }
        console.error("   ES Status Code:", error.meta.statusCode);
      }
      throw error;
    }
  }

  // ==================== USER METHODS ====================

  // Index a user document
  async indexUser(user) {
    try {
      const client = this.getClient();

      await client.index({
        index: "users",
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
        refresh: true,
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
      const client = this.getClient();

      await client.update({
        index: "users",
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
      const client = this.getClient();

      await client.delete({
        index: "users",
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
      const client = this.getClient();
      const from = (page - 1) * limit;

      const mustQueries = [];
      const shouldQueries = [];

      if (searchTerm && searchTerm.trim()) {
        shouldQueries.push(
          { match: { fullName: { query: searchTerm, boost: 2 } } },
          { match: { email: { query: searchTerm, boost: 1.5 } } },
          { wildcard: { "fullName.keyword": `*${searchTerm}*` } },
          { wildcard: { "email.keyword": `*${searchTerm}*` } }
        );
      }

      if (filters.role) {
        mustQueries.push({ term: { role: filters.role } });
      }
      if (filters.status) {
        mustQueries.push({ term: { status: filters.status } });
      }
      if (filters.provider) {
        mustQueries.push({ term: { provider: filters.provider } });
      }

      const query = {
        bool: {
          must: mustQueries.length > 0 ? mustQueries : [{ match_all: {} }],
          should: shouldQueries.length > 0 ? shouldQueries : undefined,
          minimum_should_match: shouldQueries.length > 0 ? 1 : undefined,
        },
      };

      const response = await client.search({
        index: "users",
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

  // Get user aggregations
  async getUserAggregations() {
    try {
      const client = this.getClient();

      const response = await client.search({
        index: "users",
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

  // ==================== DESTINATION METHODS ====================

  // Index a destination to Elasticsearch
  async indexDestination(destination) {
    try {
      const client = this.getClient();

      await client.index({
        index: "destinations",
        id: destination.id,
        document: {
          id: destination.id,
          name: destination.name,
          slug: destination.slug,
          description: destination.description,
          country: destination.country,
          city: destination.city,
          images: destination.images || [],
          status: destination.status,
          createdAt: destination.createdAt,
          updatedAt: destination.updatedAt,
        },
        refresh: true,
      });

      console.log(`✅ Indexed destination: ${destination.id}`);
    } catch (error) {
      console.error("❌ Failed to index destination:", error);
      throw error;
    }
  }

  // Update a destination in Elasticsearch
  async updateDestination(destId, updateData) {
    try {
      const client = this.getClient();

      await client.update({
        index: "destinations",
        id: destId,
        doc: {
          ...updateData,
          updatedAt: new Date().toISOString(),
        },
        refresh: true,
      });

      console.log(`✅ Updated destination in ES: ${destId}`);
    } catch (error) {
      console.error("❌ Failed to update destination:", error);
      throw error;
    }
  }

  // Delete a destination from Elasticsearch
  async deleteDestination(destId) {
    try {
      const client = this.getClient();

      await client.delete({
        index: "destinations",
        id: destId,
        refresh: true,
      });

      console.log(`✅ Deleted destination from ES: ${destId}`);
    } catch (error) {
      if (error.meta?.statusCode === 404) {
        console.log(`⏭️  Destination not found in ES: ${destId}`);
        return;
      }
      console.error("❌ Failed to delete destination:", error);
      throw error;
    }
  }

  // Search destinations in Elasticsearch
  async searchDestinations(searchTerm, page = 1, limit = 10, filters = {}) {
    try {
      const client = this.getClient();
      const must = [];

      if (searchTerm && searchTerm.trim()) {
        must.push({
          multi_match: {
            query: searchTerm,
            fields: ["name^3", "city^2", "country^2", "description"],
            fuzziness: "AUTO",
          },
        });
      }

      if (filters.status) {
        must.push({ term: { status: filters.status } });
      }
      if (filters.country) {
        must.push({ term: { "country.keyword": filters.country } });
      }
      if (filters.city) {
        must.push({ term: { "city.keyword": filters.city } });
      }

      const from = (page - 1) * limit;

      const result = await client.search({
        index: "destinations",
        from,
        size: limit,
        query: {
          bool: {
            must: must.length > 0 ? must : [{ match_all: {} }],
          },
        },
        sort: [{ createdAt: { order: "desc" } }],
      });

      const destinations = result.hits.hits.map((hit) => hit._source);
      const total = result.hits.total.value;

      return { destinations, total };
    } catch (error) {
      console.error("❌ Elasticsearch search failed:", error);
      throw error;
    }
  }

  // Get destination aggregations (statistics)
  async getDestinationAggregations() {
    try {
      const client = this.getClient();

      const result = await client.search({
        index: "destinations",
        size: 0,
        aggs: {
          total: {
            value_count: {
              field: "id.keyword",
            },
          },
          by_status: {
            terms: {
              field: "status.keyword",
              size: 10,
            },
          },
          by_country: {
            terms: {
              field: "country.keyword",
              size: 20,
            },
          },
          by_city: {
            terms: {
              field: "city.keyword",
              size: 50,
            },
          },
        },
      });

      const aggs = result.aggregations;

      return {
        total: aggs.total.value,
        byStatus: aggs.by_status.buckets.reduce((acc, bucket) => {
          acc[bucket.key] = bucket.doc_count;
          return acc;
        }, {}),
        byCountry: aggs.by_country.buckets.reduce((acc, bucket) => {
          acc[bucket.key] = bucket.doc_count;
          return acc;
        }, {}),
        byCity: aggs.by_city.buckets.reduce((acc, bucket) => {
          acc[bucket.key] = bucket.doc_count;
          return acc;
        }, {}),
      };
    } catch (error) {
      console.error("❌ Failed to get destination aggregations:", error);
      throw error;
    }
  }
}

module.exports = new ElasticsearchService();
