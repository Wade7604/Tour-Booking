const DestinationService = require("../services/destination.service");
const ResponseUtil = require("../utils/response.util");
const { MESSAGES } = require("../utils/constants");

class DestinationController {
  // Create destination
  createDestination = async (req, res) => {
    try {
      const { name, slug, description, country, city, images, status } =
        req.body;

      const destination = await DestinationService.createDestination({
        name,
        slug,
        description,
        country,
        city,
        images,
        status,
      });

      return ResponseUtil.created(res, destination, MESSAGES.CREATED);
    } catch (error) {
      if (error.message === "Slug already exists") {
        return ResponseUtil.conflict(res, error.message);
      }
      if (error.message === "Invalid status") {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get destination by ID
  getDestinationById = async (req, res) => {
    try {
      const { id } = req.params;
      const destination = await DestinationService.getDestinationById(id);

      return ResponseUtil.success(res, destination);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get destination by slug
  getDestinationBySlug = async (req, res) => {
    try {
      const { slug } = req.params;
      const destination = await DestinationService.getDestinationBySlug(slug);

      return ResponseUtil.success(res, destination);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get all destinations
  getAllDestinations = async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      // Optional filters
      const filters = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.country) filters.country = req.query.country;
      if (req.query.city) filters.city = req.query.city;

      const result = await DestinationService.getAllDestinations(
        page,
        limit,
        filters
      );

      return ResponseUtil.paginate(
        res,
        result.destinations,
        page,
        limit,
        result.total
      );
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };

  // Update destination
  updateDestination = async (req, res) => {
    try {
      const { id } = req.params;
      const { name, slug, description, country, city } = req.body;
      
      // Note: images are NOT updated here to prevent accidental data loss
      // Use the dedicated /destinations/:id/images endpoints to manage images

      const destination = await DestinationService.updateDestination(id, {
        name,
        slug,
        description,
        country,
        city,
        // images field is intentionally excluded
      });

      return ResponseUtil.success(res, destination, MESSAGES.UPDATED);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message === "Slug already exists") {
        return ResponseUtil.conflict(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Delete destination
  deleteDestination = async (req, res) => {
    try {
      const { id } = req.params;
      await DestinationService.deleteDestination(id);

      return ResponseUtil.success(res, null, MESSAGES.DELETED);
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Update destination status
  updateDestinationStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const destination = await DestinationService.updateDestinationStatus(
        id,
        status
      );

      return ResponseUtil.success(
        res,
        destination,
        "Destination status updated"
      );
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      if (error.message === "Invalid status") {
        return ResponseUtil.badRequest(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get destinations by country
  getDestinationsByCountry = async (req, res) => {
    try {
      const { country } = req.params;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      const result = await DestinationService.getDestinationsByCountry(
        country,
        page,
        limit
      );

      return ResponseUtil.paginate(
        res,
        result.destinations,
        page,
        limit,
        result.total
      );
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };

  // Search destinations
  searchDestinations = async (req, res) => {
    try {
      const { q } = req.query;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 20;

      if (!q) {
        return ResponseUtil.badRequest(res, "Search term is required");
      }

      // Add filters from query params
      const filters = {};
      if (req.query.status) filters.status = req.query.status;
      if (req.query.country) filters.country = req.query.country;
      if (req.query.city) filters.city = req.query.city;

      const result = await DestinationService.searchDestinations(
        q,
        page,
        limit,
        filters
      );

      return ResponseUtil.paginate(
        res,
        result.destinations,
        page,
        limit,
        result.total
      );
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };

  // Get statistics
  getDestinationStatistics = async (req, res) => {
    try {
      const stats = await DestinationService.getDestinationStatistics();
      return ResponseUtil.success(res, stats);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };

  // Elasticsearch health check
  checkElasticsearchHealth = async (req, res) => {
    try {
      const { getElasticsearch } = require("../config/elasticsearch.config");
      const client = getElasticsearch();

      const health = await client.cluster.health();
      const indexStats = await client.indices.stats({ index: "destinations" });

      const healthData = {
        cluster: {
          status: health.status,
          nodes: health.number_of_nodes,
          activeShards: health.active_shards,
        },
        index: {
          total: indexStats._all?.total?.docs?.count || 0,
          sizeInBytes: indexStats._all?.total?.store?.size_in_bytes || 0,
        },
        isHealthy: health.status === "green" || health.status === "yellow",
      };

      return ResponseUtil.success(res, healthData);
    } catch (error) {
      return ResponseUtil.error(res, {
        message: "Elasticsearch health check failed",
        error: error.message,
        isHealthy: false,
      });
    }
  };

  // Reindex one destination
  reindexDestination = async (req, res) => {
    try {
      const { id } = req.params;
      const destination = await DestinationService.reindexDestination(id);

      return ResponseUtil.success(
        res,
        destination,
        "Destination reindexed successfully"
      );
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Reindex all destinations (admin only)
  reindexAllDestinations = async (req, res) => {
    try {
      const result = await DestinationService.reindexAllDestinations();
      return ResponseUtil.success(res, result);
    } catch (error) {
      return ResponseUtil.error(res, error.message);
    }
  };

  // Add images to destination
  addImages = async (req, res) => {
    try {
      const { id } = req.params;
      const { images } = req.body;

      if (!images || !Array.isArray(images) || images.length === 0) {
        return ResponseUtil.badRequest(res, "Images array is required");
      }

      const destination = await DestinationService.addImages(id, images);

      return ResponseUtil.success(
        res,
        destination,
        "Images added successfully"
      );
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };

  // Remove images from destination
  removeImages = async (req, res) => {
    try {
      const { id } = req.params;
      const { images } = req.body;

      if (!images || !Array.isArray(images) || images.length === 0) {
        return ResponseUtil.badRequest(res, "Images array is required");
      }

      const destination = await DestinationService.removeImages(id, images);

      return ResponseUtil.success(
        res,
        destination,
        "Images removed successfully"
      );
    } catch (error) {
      if (error.message === MESSAGES.NOT_FOUND) {
        return ResponseUtil.notFound(res, error.message);
      }
      return ResponseUtil.error(res, error.message);
    }
  };
}

module.exports = new DestinationController();
