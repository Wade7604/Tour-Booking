const TourService = require("../services/tour.service");
const ResponseUtil = require("../utils/response.util");
const { HTTP_STATUS, MESSAGES } = require("../utils/constants");

class TourController {
  // Create new tour
  async createTour(req, res) {
    try {
      const tourData = {
        ...req.body,
        createdBy: req.user.uid,
        updatedBy: req.user.uid,
      };

      const tour = await TourService.createTour(tourData);

      return ResponseUtil.success(
        res,
        tour,
        MESSAGES.CREATED,
        HTTP_STATUS.CREATED
      );
    } catch (error) {
      console.error("Error creating tour:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get tour by ID
  async getTourById(req, res) {
    try {
      const { id } = req.params;
      const tour = await TourService.getTourById(id);

      return ResponseUtil.success(res, tour);
    } catch (error) {
      if (error.message === "Tour not found") {
        return ResponseUtil.error(
          res,
          MESSAGES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }
      console.error("Error getting tour:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get tour by slug
  async getTourBySlug(req, res) {
    try {
      const { slug } = req.params;
      const tour = await TourService.getTourBySlug(slug);

      return ResponseUtil.success(res, tour);
    } catch (error) {
      if (error.message === "Tour not found") {
        return ResponseUtil.error(
          res,
          MESSAGES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }
      console.error("Error getting tour by slug:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get all tours
  async getAllTours(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        status: req.query.status,
        difficulty: req.query.difficulty,
        tourType: req.query.tourType,
        destinationId: req.query.destinationId,
        featured: req.query.featured === "true" ? true : undefined,
        minPrice: req.query.minPrice ? parseFloat(req.query.minPrice) : undefined,
        maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice) : undefined,
        sortBy: req.query.sortBy || "createdAt",
        sortOrder: req.query.sortOrder || "desc",
      };

      const result = await TourService.getAllTours(options);

      return ResponseUtil.success(res, result);
    } catch (error) {
      console.error("Error getting tours:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Update tour
  async updateTour(req, res) {
    try {
      const { id } = req.params;
      const updateData = {
        ...req.body,
        updatedBy: req.user.uid,
      };

      const tour = await TourService.updateTour(id, updateData);

      if (!tour) {
        return ResponseUtil.error(
          res,
          MESSAGES.NOT_FOUND,
          HTTP_STATUS.NOT_FOUND
        );
      }

      return ResponseUtil.success(res, tour, MESSAGES.UPDATED);
    } catch (error) {
      console.error("Error updating tour:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Delete tour
  async deleteTour(req, res) {
    try {
      const { id } = req.params;
      await TourService.deleteTour(id);

      return ResponseUtil.success(res, null, MESSAGES.DELETED);
    } catch (error) {
      console.error("Error deleting tour:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Update tour status
  async updateTourStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const tour = await TourService.updateTourStatus(id, status);

      return ResponseUtil.success(res, tour, MESSAGES.UPDATED);
    } catch (error) {
      console.error("Error updating tour status:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Search tours
  async searchTours(req, res) {
    try {
      const { q } = req.query;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
        difficulty: req.query.difficulty,
        tourType: req.query.tourType,
        minPrice: req.query.minPrice,
        maxPrice: req.query.maxPrice,
      };

      // Search functionality is still basic in TourModel, but we route it through service
      const results = await TourModel.search(q, options);

      return ResponseUtil.success(res, results);
    } catch (error) {
      console.error("Error searching tours:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get tours by destination
  async getToursByDestination(req, res) {
    try {
      const { destinationId } = req.params;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 10,
      };

      const result = await TourService.getAllTours({ ...options, destinationId });

      return ResponseUtil.success(res, result);
    } catch (error) {
      console.error("Error getting tours by destination:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Get tour statistics
  async getTourStatistics(req, res) {
    try {
      const stats = await TourService.getTourStatistics();

      return ResponseUtil.success(res, stats);
    } catch (error) {
      console.error("Error getting tour statistics:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Add images to tour
  async addImages(req, res) {
    try {
      const { id } = req.params;
      const { images } = req.body;

      const tour = await TourService.addImages(id, images);

      return ResponseUtil.success(res, tour, MESSAGES.UPDATED);
    } catch (error) {
      console.error("Error adding images:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Remove image from tour
  async removeImage(req, res) {
    try {
      const { id, imageUrl } = req.params;

      const tour = await TourService.removeImage(id, decodeURIComponent(imageUrl));

      return ResponseUtil.success(res, tour, MESSAGES.UPDATED);
    } catch (error) {
      console.error("Error removing image:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Set cover image
  async setCoverImage(req, res) {
    try {
      const { id } = req.params;
      const { coverImage } = req.body;

      const tour = await TourService.setCoverImage(id, coverImage);

      return ResponseUtil.success(res, tour, MESSAGES.UPDATED);
    } catch (error) {
      console.error("Error setting cover image:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Add available date
  async addAvailableDate(req, res) {
    try {
      const { id } = req.params;
      const dateData = req.body;

      const tour = await TourService.addAvailableDate(id, dateData);

      return ResponseUtil.success(res, tour, MESSAGES.UPDATED);
    } catch (error) {
      console.error("Error adding available date:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Update available date
  async updateAvailableDate(req, res) {
    try {
      const { id, dateIndex } = req.params;
      const dateData = req.body;

      const tour = await TourService.updateAvailableDate(
        id,
        parseInt(dateIndex),
        dateData
      );

      return ResponseUtil.success(res, tour, MESSAGES.UPDATED);
    } catch (error) {
      console.error("Error updating available date:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Remove available date
  async removeAvailableDate(req, res) {
    try {
      const { id, dateIndex } = req.params;

      const tour = await TourService.removeAvailableDate(id, parseInt(dateIndex));

      return ResponseUtil.success(res, tour, MESSAGES.UPDATED);
    } catch (error) {
      console.error("Error removing available date:", error);
      return ResponseUtil.error(
        res,
        MESSAGES.INTERNAL_ERROR,
        HTTP_STATUS.INTERNAL_SERVER_ERROR
      );
    }
  }
}

module.exports = new TourController();
