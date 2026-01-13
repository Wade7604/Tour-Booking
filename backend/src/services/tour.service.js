const TourModel = require("../models/tour.model");
const { TOUR_STATUS } = require("../utils/constants");

class TourService {
  // Create new tour
  async createTour(tourData) {
    try {
      // Initialize bookedSlots to 0 for all available dates
      if (tourData.availableDates) {
        tourData.availableDates = tourData.availableDates.map(date => ({
          ...date,
          bookedSlots: date.bookedSlots || 0
        }));
      }
      return await TourModel.create(tourData);
    } catch (error) {
      throw error;
    }
  }

  // Get tour by ID
  async getTourById(tourId) {
    try {
      const tour = await TourModel.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }
      return this._attachAvailableSlots(tour);
    } catch (error) {
      throw error;
    }
  }

  // Get tour by slug
  async getTourBySlug(slug) {
    try {
      const tour = await TourModel.findBySlug(slug);
      if (!tour) {
        throw new Error("Tour not found");
      }
      return this._attachAvailableSlots(tour);
    } catch (error) {
      throw error;
    }
  }

  // Helper to attach availableSlots to each date
  _attachAvailableSlots(tour) {
    if (!tour.availableDates) return tour;

    tour.availableDates = tour.availableDates.map(date => {
      const maxSlots = date.maxSlots || tour.maxGroupSize || 0;
      const bookedSlots = date.bookedSlots || 0;
      return {
        ...date,
        availableSlots: Math.max(maxSlots - bookedSlots, 0)
      };
    });

    return tour;
  }

  // Update tour
  async updateTour(tourId, updateData) {
    try {
      return await TourModel.update(tourId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Delete tour
  async deleteTour(tourId) {
    try {
      return await TourModel.delete(tourId);
    } catch (error) {
      throw error;
    }
  }

  // Get all tours with pagination and filters
  async getAllTours(options = {}) {
    try {
      const result = await TourModel.findAll(options);
      if (result.tours) {
        result.tours = result.tours.map(tour => this._attachAvailableSlots(tour));
      }
      return result;
    } catch (error) {
      throw error;
    }
  }

  // Update tour status
  async updateTourStatus(tourId, status) {
    try {
      if (!Object.values(TOUR_STATUS).includes(status)) {
        throw new Error("Invalid tour status");
      }
      return await TourModel.updateStatus(tourId, status);
    } catch (error) {
      throw error;
    }
  }

  // Add images to tour
  async addImages(tourId, imageUrls) {
    try {
      const tour = await TourModel.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }

      const updatedImages = [...(tour.images || []), ...imageUrls];
      const updateData = { images: updatedImages };
      
      // If no cover image, use the first image as cover
      if ((!tour.coverImage || tour.coverImage === "") && updatedImages.length > 0) {
        updateData.coverImage = updatedImages[0];
      }

      return await TourModel.update(tourId, updateData);
    } catch (error) {
      throw error;
    }
  }

  // Remove image from tour
  async removeImage(tourId, imageUrl) {
    try {
      const tour = await TourModel.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }

      const updatedImages = (tour.images || []).filter((img) => img !== imageUrl);
      return await TourModel.update(tourId, { images: updatedImages });
    } catch (error) {
      throw error;
    }
  }

  // Set cover image
  async setCoverImage(tourId, imageUrl) {
    try {
      return await TourModel.update(tourId, { coverImage: imageUrl });
    } catch (error) {
      throw error;
    }
  }

  // Add available date
  async addAvailableDate(tourId, dateData) {
    try {
      const tour = await TourModel.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }

      const updatedDates = [...(tour.availableDates || []), { ...dateData, bookedSlots: 0 }];
      return await TourModel.update(tourId, { availableDates: updatedDates });
    } catch (error) {
      throw error;
    }
  }

  // Update available date
  async updateAvailableDate(tourId, dateIndex, dateData) {
    try {
      const tour = await TourModel.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }

      const updatedDates = [...(tour.availableDates || [])];
      if (dateIndex < 0 || dateIndex >= updatedDates.length) {
        throw new Error("Invalid date index");
      }

      updatedDates[dateIndex] = { ...updatedDates[dateIndex], ...dateData };
      return await TourModel.update(tourId, { availableDates: updatedDates });
    } catch (error) {
      throw error;
    }
  }

  // Remove available date
  async removeAvailableDate(tourId, dateIndex) {
    try {
      const tour = await TourModel.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }

      const updatedDates = (tour.availableDates || []).filter(
        (_, index) => index !== dateIndex
      );
      return await TourModel.update(tourId, { availableDates: updatedDates });
    } catch (error) {
      throw error;
    }
  }

 /**
 * Search tours with filters
 * @param {string} query - Search query string
 * @param {Object} options - Search options
 * @returns {Promise<Object>} Search results with pagination
 */
async searchTours(query, options = {}) {
  try {
    // Use the existing TourModel.search() method which handles Elasticsearch
    // and falls back to basic Firestore search
    const result = await TourModel.search(query, options);
    
    // Attach available slots to tours
    if (result.tours) {
      result.tours = result.tours.map(tour => this._attachAvailableSlots(tour));
    }
    
    return result;
  } catch (error) {
    console.error("Error in searchTours service:", error);
    throw error;
  }
}
  // Increment booked slots
  async incrementBookedSlots(tourId, startDate, endDate, slots = 1) {
    try {
      const tour = await TourModel.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }

      const updatedDates = tour.availableDates.map((date) => {
        if (date.startDate === startDate && date.endDate === endDate) {
          return {
            ...date,
            bookedSlots: (date.bookedSlots || 0) + slots,
          };
        }
        return date;
      });

      return await TourModel.update(tourId, { availableDates: updatedDates });
    } catch (error) {
      throw error;
    }
  }

  // Decrement booked slots
  async decrementBookedSlots(tourId, startDate, endDate, slots = 1) {
    try {
      const tour = await TourModel.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }

      const updatedDates = tour.availableDates.map((date) => {
        if (date.startDate === startDate && date.endDate === endDate) {
          return {
            ...date,
            bookedSlots: Math.max((date.bookedSlots || 0) - slots, 0),
          };
        }
        return date;
      });

      return await TourModel.update(tourId, { availableDates: updatedDates });
    } catch (error) {
      throw error;
    }
  }

  // Get available slots
  async getAvailableSlots(tourId, startDate, endDate) {
    try {
      const tour = await TourModel.findById(tourId);
      if (!tour) {
        throw new Error("Tour not found");
      }

      const dateSlot = tour.availableDates.find(
        (date) => date.startDate === startDate && date.endDate === endDate
      );

      if (!dateSlot) {
        return 0;
      }

      const maxSlots = dateSlot.maxSlots || tour.maxGroupSize || 0;
      const bookedSlots = dateSlot.bookedSlots || 0;
      return Math.max(maxSlots - bookedSlots, 0);
    } catch (error) {
      throw error;
    }
  }

  // Get statistics
  async getTourStatistics() {
    try {
      return await TourModel.getStatistics();
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TourService();