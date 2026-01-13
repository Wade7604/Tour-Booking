const { getFirestore } = require("../config/firebase.config");
const { COLLECTIONS } = require("../config/database.config");
const { TOUR_STATUS } = require("../utils/constants");
const ElasticsearchService = require("../services/elasticsearch.service");

class TourModel {
  constructor() {
    this.db = getFirestore();
    this.collection = this.db.collection(COLLECTIONS.TOURS);
  }

  // Create new tour
  async create(tourData) {
    try {
      const tourRef = this.collection.doc();
      const tourId = tourRef.id;

      const newTour = {
        id: tourId,
        name: tourData.name,
        slug: tourData.slug,
        description: tourData.description,
        
        // Destination info
        destinationId: tourData.destinationId || null,
        destinations: tourData.destinations || [],
        
        // Duration
        duration: tourData.duration,
        
        // Pricing
        price: tourData.price,
        
        // Itinerary
        itinerary: tourData.itinerary || [],
        
        // Tour info
        maxGroupSize: tourData.maxGroupSize,
        minGroupSize: tourData.minGroupSize || 1,
        difficulty: tourData.difficulty,
        tourType: tourData.tourType,
        
        // Includes/Excludes
        includes: tourData.includes || [],
        excludes: tourData.excludes || [],
        requirements: tourData.requirements || [],
        
        // Images
        images: tourData.images || [],
        coverImage: tourData.coverImage || "",
        
        // Available dates
        availableDates: tourData.availableDates || [],
        
        // Status
        status: tourData.status || TOUR_STATUS.DRAFT,
        featured: tourData.featured || false,
        
        // Metadata
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: tourData.createdBy || null,
        updatedBy: tourData.updatedBy || null,
      };

      await tourRef.set(newTour);

      // Index to Elasticsearch
      try {
        await ElasticsearchService.indexTour(newTour);
      } catch (esError) {
        console.error("Failed to index tour to ES:", esError);
      }

      return newTour;
    } catch (error) {
      throw error;
    }
  }



  // Find by ID with population
  async findById(tourId) {
    try {
      const doc = await this.collection.doc(tourId).get();
      if (!doc.exists) return null;
      
      const tour = { id: doc.id, ...doc.data() };
      
      // Populate destination
      if (tour.destinationId) {
        const DestinationModel = require("./destination.model");
        const destination = await DestinationModel.findById(tour.destinationId);
        if (destination) {
          tour.destination = destination;
        }
      }
      
      return tour;
    } catch (error) {
      throw error;
    }
  }

  // Find tour by slug
  async findBySlug(slug) {
    try {
      const snapshot = await this.collection
        .where("slug", "==", slug)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      throw error;
    }
  }

  // Update tour
  async update(tourId, updateData) {
    try {
      const tourRef = this.collection.doc(tourId);
      const updatePayload = {
        ...updateData,
        updatedAt: new Date().toISOString(),
      };

      await tourRef.update(updatePayload);

      const updatedDoc = await tourRef.get();
      const tour = updatedDoc.data();

      // Update in Elasticsearch
      try {
        await ElasticsearchService.updateTour(tourId, updatePayload);
      } catch (esError) {
        console.error("Failed to update tour in ES:", esError);
      }

      return tour;
    } catch (error) {
      throw error;
    }
  }

  // Delete tour
  async delete(tourId) {
    try {
      await this.collection.doc(tourId).delete();

      // Delete from Elasticsearch
      try {
        await ElasticsearchService.deleteTour(tourId);
      } catch (esError) {
        console.error("Failed to delete tour from ES:", esError);
      }

      return true;
    } catch (error) {
      throw error;
    }
  }

  // Get all tours with pagination and filters
  async findAll(options = {}) {
    try {
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

      let query = this.collection;

      // Apply filters
      if (status) {
        query = query.where("status", "==", status);
      }
      if (difficulty) {
        const difficultyArray = difficulty.split(",");
        if (difficultyArray.length > 1) {
          query = query.where("difficulty", "in", difficultyArray);
        } else {
          query = query.where("difficulty", "==", difficulty);
        }
      }
      if (tourType) {
        const tourTypeArray = tourType.split(",");
        if (tourTypeArray.length > 1) {
          query = query.where("tourType", "in", tourTypeArray);
        } else {
          query = query.where("tourType", "==", tourType);
        }
      }
      if (destinationId) {
        query = query.where("destinationId", "==", destinationId);
      }
      if (featured !== undefined) {
        query = query.where("featured", "==", featured);
      }

      // Apply sorting
      let sortQuery = query.orderBy(sortBy, sortOrder);

      // Get total count
      const countSnapshot = await query.get();
      const total = countSnapshot.size;

      // Apply pagination
      const offset = (page - 1) * limit;
      
      let snapshot;
      try {
        snapshot = await sortQuery.limit(limit).offset(offset).get();
      } catch (error) {
        // Check if error is due to missing index
        if (error.code === 9 || error.message.includes("requires an index")) {
           console.warn("⚠️ Missing Firestore index. Falling back to in-memory sorting.");
           if (error.details) console.warn(`   ${error.details}`);
           
           // Fetch all matching documents without sorting
           const allDocsSnapshot = await query.get();
           
           // Manual Sort
           const allDocs = [];
           allDocsSnapshot.forEach(doc => allDocs.push({ id: doc.id, ...doc.data() }));
           
           // Sort function
           allDocs.sort((a, b) => {
             let valA = a[sortBy];
             let valB = b[sortBy];
             
             // Handle dates
             if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
               valA = new Date(valA).getTime();
               valB = new Date(valB).getTime();
             }
             
             if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
             if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
             return 0;
           });
           
           // Manual Pagination
           const pagedDocs = allDocs.slice(offset, offset + limit);
           
           // Mock snapshot structure for compatibility
           snapshot = {
             forEach: (callback) => pagedDocs.forEach(doc => callback({ id: doc.id, data: () => doc }))
           };
        } else {
          throw error;
        }
      }

      const tours = [];
      const destinationIds = new Set();

      snapshot.forEach((doc) => {
        // If it's a real firestore doc, use .data(), otherwise it's our mock object
        const tour = doc.data ? { id: doc.id, ...doc.data() } : doc;
        
        // Filter by price if specified (already done in fallback, but good to keep consistency)
        if (minPrice !== undefined && (tour.price?.adult || 0) < minPrice) return;
        if (maxPrice !== undefined && (tour.price?.adult || 0) > maxPrice) return;
        
        tours.push(tour);
        if (tour.destinationId) {
          destinationIds.add(tour.destinationId);
        }
      });

      // Populate destinations
      if (destinationIds.size > 0) {
        const DestinationModel = require("./destination.model");
        const destinations = await Promise.all(
          Array.from(destinationIds).map(id => DestinationModel.findById(id))
        );
        
        const destinationMap = {};
        destinations.forEach(dest => {
          if (dest) destinationMap[dest.id] = dest;
        });

        tours.forEach(tour => {
          if (tour.destinationId && destinationMap[tour.destinationId]) {
            tour.destination = destinationMap[tour.destinationId];
          }
        });
      }

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
      throw error;
    }
  }

  // Search tours using Elasticsearch
  async search(searchTerm, options = {}) {
    try {
      return await ElasticsearchService.searchTours(searchTerm, options);
    } catch (error) {
      console.error("Elasticsearch search failed, falling back to basic search:", error);
      // Fallback to basic search if Elasticsearch fails
      const allTours = await this.findAll(options);
      if (!searchTerm) return allTours;
      
      const filtered = allTours.tours.filter(tour => {
        const name = (tour.name || "").toLowerCase();
        const description = (tour.description || "").toLowerCase();
        const term = searchTerm.toLowerCase();
        
        return name.includes(term) || description.includes(term);
      });
      
      return { tours: filtered, pagination: allTours.pagination };
    }
  }

  // Get tours by destination
  async findByDestination(destinationId, options = {}) {
    try {
      return await this.findAll({ ...options, destinationId });
    } catch (error) {
      throw error;
    }
  }

  // Get tour statistics
  async getStatistics() {
    try {
      const snapshot = await this.collection.get();
      const tours = [];
      snapshot.forEach((doc) => tours.push(doc.data()));

      const stats = {
        total: tours.length,
        active: tours.filter((t) => t.status === TOUR_STATUS.ACTIVE).length,
        inactive: tours.filter((t) => t.status === TOUR_STATUS.INACTIVE).length,
        draft: tours.filter((t) => t.status === TOUR_STATUS.DRAFT).length,
        featured: tours.filter((t) => t.featured).length,
        byDifficulty: {
          easy: tours.filter((t) => t.difficulty === "easy").length,
          moderate: tours.filter((t) => t.difficulty === "moderate").length,
          challenging: tours.filter((t) => t.difficulty === "challenging")
            .length,
        },
        byType: {},
      };

      // Count by tour type
      tours.forEach((tour) => {
        if (tour.tourType) {
          stats.byType[tour.tourType] =
            (stats.byType[tour.tourType] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      throw error;
    }
  }

  // Update tour status
  async updateStatus(tourId, status) {
    try {
      return await this.update(tourId, { status });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TourModel();
