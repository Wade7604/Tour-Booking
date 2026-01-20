const { getFirestore } = require("../config/firebase.config");
const { COLLECTIONS } = require("../config/database.config");
const { DESTINATION_STATUS } = require("../utils/constants");
const ElasticsearchService = require("../services/elasticsearch.service");

class DestinationModel {
  constructor() {
    this.db = getFirestore();
    this.collection = this.db.collection(COLLECTIONS.DESTINATIONS);
  }

  // Create new destination
  async create(destinationData) {
    try {
      const destRef = this.collection.doc();
      const destId = destRef.id;

      const newDestination = {
        id: destId,
        name: destinationData.name,
        slug: destinationData.slug,
        description: destinationData.description,
        country: destinationData.country,
        city: destinationData.city,
        images: destinationData.images || [],
        status: destinationData.status || DESTINATION_STATUS.ACTIVE,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await destRef.set(newDestination);

      // ✅ Index to Elasticsearch
      try {
        await ElasticsearchService.indexDestination(newDestination);
      } catch (esError) {
        console.error("Failed to index destination to ES:", esError);
      }

      return newDestination;
    } catch (error) {
      throw error;
    }
  }

  // Find destination by ID
  async findById(destId) {
    try {
      const doc = await this.collection.doc(destId).get();

      if (!doc.exists) {
        return null;
      }

      return doc.data();
    } catch (error) {
      throw error;
    }
  }

  // Find destination by slug
  async findBySlug(slug) {
    try {
      const snapshot = await this.collection
        .where("slug", "==", slug)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      return snapshot.docs[0].data();
    } catch (error) {
      throw error;
    }
  }

  // Update destination
  async update(destId, updateData) {
    try {
      const destRef = this.collection.doc(destId);
      
      // Remove undefined values to prevent Firestore errors
      const cleanedData = {};
      Object.keys(updateData).forEach(key => {
        if (updateData[key] !== undefined) {
          cleanedData[key] = updateData[key];
        }
      });
      
      const updatePayload = {
        ...cleanedData,
        updatedAt: new Date().toISOString(),
      };

      await destRef.update(updatePayload);

      const updatedDoc = await destRef.get();
      const destination = updatedDoc.data();

      // ✅ Update in Elasticsearch
      try {
        await ElasticsearchService.updateDestination(destId, updatePayload);
      } catch (esError) {
        console.error("Failed to update destination in ES:", esError);
      }

      return destination;
    } catch (error) {
      throw error;
    }
  }

  // Delete destination
  async delete(destId) {
    try {
      await this.collection.doc(destId).delete();

      // ✅ Delete from Elasticsearch
      try {
        await ElasticsearchService.deleteDestination(destId);
      } catch (esError) {
        console.error("Failed to delete destination from ES:", esError);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get all destinations with pagination
  async findAll(page = 1, limit = 10, filters = {}) {
    try {
      let query = this.collection;

      // Apply filters
      if (filters.status) {
        query = query.where("status", "==", filters.status);
      }
      if (filters.country) {
        query = query.where("country", "==", filters.country);
      }
      if (filters.city) {
        query = query.where("city", "==", filters.city);
      }

      // Count total
      const countSnapshot = await query.get();
      const total = countSnapshot.size;

      // Apply pagination
      const startAt = (page - 1) * limit;
      const paginatedQuery = query
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(startAt);

      const result = await paginatedQuery.get();
      const destinations = result.docs.map((doc) => doc.data());

      return { destinations, total };
    } catch (error) {
      throw error;
    }
  }

  // Find destinations by country
  async findByCountry(country, page = 1, limit = 10) {
    try {
      const query = this.collection.where("country", "==", country);

      // Count total
      const countSnapshot = await query.get();
      const total = countSnapshot.size;

      // Apply pagination
      const startAt = (page - 1) * limit;
      const paginatedQuery = query
        .orderBy("createdAt", "desc")
        .limit(limit)
        .offset(startAt);

      const result = await paginatedQuery.get();
      const destinations = result.docs.map((doc) => doc.data());

      return { destinations, total };
    } catch (error) {
      throw error;
    }
  }

  // ✅ Search destinations using Elasticsearch
  async search(searchTerm, page = 1, limit = 10, filters = {}) {
    try {
      // Use Elasticsearch for search
      return await ElasticsearchService.searchDestinations(
        searchTerm,
        page,
        limit,
        filters
      );
    } catch (error) {
      console.error("Elasticsearch search failed, falling back to Firestore");

      // Fallback to Firestore if ES fails
      const snapshot = await this.collection.orderBy("createdAt", "desc").get();

      const searchLower = searchTerm.toLowerCase();
      const filteredDestinations = snapshot.docs
        .map((doc) => doc.data())
        .filter((dest) => {
          const nameMatch = dest.name?.toLowerCase().includes(searchLower);
          const cityMatch = dest.city?.toLowerCase().includes(searchLower);
          const countryMatch = dest.country
            ?.toLowerCase()
            .includes(searchLower);

          let matchesFilters = true;
          if (filters.status && dest.status !== filters.status)
            matchesFilters = false;
          if (filters.country && dest.country !== filters.country)
            matchesFilters = false;
          if (filters.city && dest.city !== filters.city)
            matchesFilters = false;

          return (nameMatch || cityMatch || countryMatch) && matchesFilters;
        });

      const total = filteredDestinations.length;
      const startAt = (page - 1) * limit;
      const destinations = filteredDestinations.slice(startAt, startAt + limit);

      return { destinations, total };
    }
  }

  // Check if slug exists
  async slugExists(slug) {
    try {
      const destination = await this.findBySlug(slug);
      return destination !== null;
    } catch (error) {
      throw error;
    }
  }

  // ✅ Get destination statistics using Elasticsearch
  async getStatistics() {
    try {
      return await ElasticsearchService.getDestinationAggregations();
    } catch (error) {
      console.error("Failed to get stats from ES, using Firestore");

      // Fallback to Firestore
      const snapshot = await this.collection.get();
      const destinations = snapshot.docs.map((doc) => doc.data());

      const stats = {
        total: destinations.length,
        byStatus: {},
        byCountry: {},
        byCity: {},
      };

      destinations.forEach((dest) => {
        stats.byStatus[dest.status] = (stats.byStatus[dest.status] || 0) + 1;
        stats.byCountry[dest.country] =
          (stats.byCountry[dest.country] || 0) + 1;
        stats.byCity[dest.city] = (stats.byCity[dest.city] || 0) + 1;
      });

      return stats;
    }
  }

  // Batch update destinations
  async batchUpdate(destIds, updateData) {
    try {
      const batch = this.db.batch();
      const updatePayload = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      destIds.forEach((destId) => {
        const destRef = this.collection.doc(destId);
        batch.update(destRef, updatePayload);
      });

      await batch.commit();

      // ✅ Update in Elasticsearch
      try {
        for (const destId of destIds) {
          await ElasticsearchService.updateDestination(destId, updatePayload);
        }
      } catch (esError) {
        console.error("Failed to batch update destinations in ES:", esError);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Batch delete destinations
  async batchDelete(destIds) {
    try {
      const batch = this.db.batch();

      destIds.forEach((destId) => {
        const destRef = this.collection.doc(destId);
        batch.delete(destRef);
      });

      await batch.commit();

      // ✅ Delete from Elasticsearch
      try {
        for (const destId of destIds) {
          await ElasticsearchService.deleteDestination(destId);
        }
      } catch (esError) {
        console.error("Failed to batch delete destinations from ES:", esError);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new DestinationModel();
