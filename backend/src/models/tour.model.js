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

      // Index to Elasticsearch (TODO: Implement ElasticsearchService.indexTour)
      // try {
      //   await ElasticsearchService.indexTour(newTour);
      // } catch (esError) {
      //   console.error("Failed to index tour to ES:", esError);
      // }

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

      // Update in Elasticsearch (TODO: Implement)
      // try {
      //   await ElasticsearchService.updateTour(tourId, updatePayload);
      // } catch (esError) {
      //   console.error("Failed to update tour in ES:", esError);
      // }

      return tour;
    } catch (error) {
      throw error;
    }
  }

  // Delete tour
  async delete(tourId) {
    try {
      await this.collection.doc(tourId).delete();

      // Delete from Elasticsearch (TODO: Implement)
      // try {
      //   await ElasticsearchService.deleteTour(tourId);
      // } catch (esError) {
      //   console.error("Failed to delete tour from ES:", esError);
      // }

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
        query = query.where("difficulty", "==", difficulty);
      }
      if (tourType) {
        query = query.where("tourType", "==", tourType);
      }
      if (destinationId) {
        query = query.where("destinationId", "==", destinationId);
      }
      if (featured !== undefined) {
        query = query.where("featured", "==", featured);
      }

      // Apply sorting
      query = query.orderBy(sortBy, sortOrder);

      // Get total count
      const countSnapshot = await query.get();
      const total = countSnapshot.size;

      // Apply pagination
      const offset = (page - 1) * limit;
      const snapshot = await query.limit(limit).offset(offset).get();

      const tours = [];
      const destinationIds = new Set();

      snapshot.forEach((doc) => {
        const tour = { id: doc.id, ...doc.data() };
        // Filter by price if specified
        if (minPrice !== undefined && tour.price.adult < minPrice) return;
        if (maxPrice !== undefined && tour.price.adult > maxPrice) return;
        
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

  // Search tours using Elasticsearch (TODO: Implement)
  async search(searchTerm, options = {}) {
    try {
      // Fallback to basic search until Elasticsearch is implemented
      const allTours = await this.findAll(options);
      if (!searchTerm) return allTours;
      
      const filtered = allTours.tours.filter(tour => 
        tour.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tour.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      return { tours: filtered, pagination: allTours.pagination };
    } catch (error) {
      throw error;
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

  // Add images to tour
  async addImages(tourId, imageUrls) {
    try {
      const tour = await this.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }

      const updatedImages = [...(tour.images || []), ...imageUrls];
      
      const updateData = { images: updatedImages };
      
      // If no cover image, use the first image as cover
      if ((!tour.coverImage || tour.coverImage === "") && updatedImages.length > 0) {
        updateData.coverImage = updatedImages[0];
      }

      return await this.update(tourId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Remove image from tour
  async removeImage(tourId, imageUrl) {
    try {
      const tour = await this.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }

      const updatedImages = tour.images.filter((img) => img !== imageUrl);
      return await this.update(tourId, { images: updatedImages });
    } catch (error) {
      throw error;
    }
  }

  // Set cover image
  async setCoverImage(tourId, imageUrl) {
    try {
      return await this.update(tourId, { coverImage: imageUrl });
    } catch (error) {
      throw error;
    }
  }

  // Add available date
  async addAvailableDate(tourId, dateData) {
    try {
      const tour = await this.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }

      const updatedDates = [...(tour.availableDates || []), dateData];
      return await this.update(tourId, { availableDates: updatedDates });
    } catch (error) {
      throw error;
    }
  }

  // Update available date
  async updateAvailableDate(tourId, dateIndex, dateData) {
    try {
      const tour = await this.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }

      const updatedDates = [...tour.availableDates];
      updatedDates[dateIndex] = { ...updatedDates[dateIndex], ...dateData };
      return await this.update(tourId, { availableDates: updatedDates });
    } catch (error) {
      throw error;
    }
  }

  // Remove available date
  async removeAvailableDate(tourId, dateIndex) {
    try {
      const tour = await this.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }

      const updatedDates = tour.availableDates.filter(
        (_, index) => index !== dateIndex
      );
      return await this.update(tourId, { availableDates: updatedDates });
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TourModel();
