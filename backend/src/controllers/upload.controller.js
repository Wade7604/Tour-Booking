const CloudinaryService = require("../services/cloudinary.service");

class UploadController {
  /**
   * Upload user avatar
   * Route: POST /api/uploads/avatar (own) or POST /api/uploads/avatar/:userId (admin)
   */
  async uploadAvatar(req, res) {
    try {
      // Get userId from params (admin upload for others) or from authenticated user (own upload)
      const userId = req.params.userId || req.user.uid;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No file uploaded",
        });
      }

      // Validate image file
      CloudinaryService.validateImageFile(req.file);

      // If uploading for own account (no userId in params), ensure it matches authenticated user
      if (!req.params.userId && userId !== req.user.uid) {
        return res.status(403).json({
          success: false,
          message: "You can only upload your own avatar",
        });
      }

      // Upload avatar to Cloudinary
      const result = await CloudinaryService.uploadAvatar(req.file, userId);

      // Update user avatar in database
      const UserService = require("../services/user.service");
      await UserService.updateUser(userId, { avatar: result.url });

      return res.status(200).json({
        success: true,
        message: "Avatar uploaded successfully",
        data: {
          url: result.url,
          publicId: result.publicId,
          thumbnail: CloudinaryService.getThumbnail(result.publicId),
        },
      });
    } catch (error) {
      console.error("Upload avatar error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to upload avatar",
      });
    }
  }

  /**
   * Upload destination images
   */
  async uploadDestinationImages(req, res) {
    try {
      const { destinationId } = req.params;

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          message: "No files uploaded",
        });
      }

      // Validate image files
      CloudinaryService.validateImageFiles(req.files);

      // Upload images to Cloudinary
      const results = await CloudinaryService.uploadDestinationImages(
        req.files,
        destinationId
      );

      // Extract image URLs
      const imageUrls = results.map((result) => result.url);

      // Save image URLs to destination database
      const DestinationService = require("../services/destination.service");
      const updatedDestination = await DestinationService.addImages(
        destinationId,
        imageUrls
      );

      return res.status(200).json({
        success: true,
        message: "Images uploaded successfully",
        data: {
          images: results.map((result, index) => ({
            url: result.url,
            publicId: result.publicId,
            thumbnail: CloudinaryService.getThumbnail(result.publicId),
            order: index,
          })),
          destination: updatedDestination,
        },
      });
    } catch (error) {
      console.error("Upload destination images error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to upload images",
      });
    }
  }

  /**
   * Delete single destination image
   */
  async deleteDestinationImage(req, res) {
    try {
      const { destinationId } = req.params;
      const { publicId } = req.body;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: "Public ID is required",
        });
      }

      // Delete from Cloudinary
      const result = await CloudinaryService.deleteAvatar(publicId);

      // Extract URL from publicId to remove from database
      // The URL pattern is typically: https://res.cloudinary.com/{cloud_name}/image/upload/{version}/{publicId}
      // We need to find and remove the matching URL from destination.images array
      const DestinationService = require("../services/destination.service");
      const destination = await DestinationService.getDestinationById(
        destinationId
      );

      // Find the image URL that contains this publicId
      const imageToRemove = destination.images?.find((img) =>
        img.includes(publicId)
      );

      if (imageToRemove) {
        await DestinationService.removeImages(destinationId, [imageToRemove]);
      }

      return res.status(200).json({
        success: true,
        message: "Image deleted successfully",
        data: result,
      });
    } catch (error) {
      console.error("Delete destination image error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to delete image",
      });
    }
  }

  /**
   * Delete multiple destination images
   */
  async deleteMultipleDestinationImages(req, res) {
    try {
      const { destinationId } = req.params;
      const { publicIds } = req.body;

      if (!publicIds || !Array.isArray(publicIds)) {
        return res.status(400).json({
          success: false,
          message: "Public IDs array is required",
        });
      }

      // Delete from Cloudinary
      const result = await CloudinaryService.deleteDestinationImages(publicIds);

      // Remove URLs from destination database
      const DestinationService = require("../services/destination.service");
      const destination = await DestinationService.getDestinationById(
        destinationId
      );

      // Find all image URLs that contain any of the publicIds
      const imagesToRemove = destination.images?.filter((img) =>
        publicIds.some((publicId) => img.includes(publicId))
      );

      if (imagesToRemove && imagesToRemove.length > 0) {
        await DestinationService.removeImages(destinationId, imagesToRemove);
      }

      return res.status(200).json({
        success: true,
        message: "Images deleted successfully",
        data: result,
      });
    } catch (error) {
      console.error("Delete destination images error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to delete images",
      });
    }
  }

  /**
 * Upload tour images
 */
async uploadTourImages(req, res) {
  try {
    const { tourId } = req.params;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No files uploaded",
      });
    }

    // Validate image files
    CloudinaryService.validateImageFiles(req.files);

    // Upload images to Cloudinary
    const results = await CloudinaryService.uploadDestinationImages(
      req.files,
      `tours/${tourId}`
    );

    // Extract image URLs
    const imageUrls = results.map((result) => result.url);

    console.log('Uploaded image URLs:', imageUrls); // Debug log

    // Save image URLs to tour database
    const TourModel = require("../models/tour.model");
    const updatedTour = await TourModel.addImages(tourId, imageUrls);

    console.log('Updated tour images:', updatedTour.images); // Debug log

    return res.status(200).json({
      success: true,
      message: "Images uploaded successfully",
      data: {
        // Trả về mảng images đầy đủ của tour (bao gồm cả ảnh cũ + ảnh mới)
        allImages: updatedTour.images || [],
        // Trả về info của ảnh mới vừa upload
        newImages: results.map((result, index) => ({
          url: result.url,
          publicId: result.publicId,
          thumbnail: CloudinaryService.getThumbnail(result.publicId),
          order: index,
        })),
        tour: updatedTour,
      },
    });
  } catch (error) {
    console.error("Upload tour images error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload images",
    });
  }
}
  /**
   * Delete single tour image
   */
  async deleteTourImage(req, res) {
    try {
      const { tourId } = req.params;
      const { publicId } = req.body;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: "Public ID is required",
        });
      }

      // Delete from Cloudinary
      const result = await CloudinaryService.deleteAvatar(publicId);

      // Find and remove the image URL from tour
      const TourModel = require("../models/tour.model");
      const tour = await TourModel.findById(tourId);

      const imageToRemove = tour.images?.find((img) =>
        img.includes(publicId)
      );

      if (imageToRemove) {
        await TourModel.removeImage(tourId, imageToRemove);
      }

      return res.status(200).json({
        success: true,
        message: "Image deleted successfully",
        data: result,
      });
    } catch (error) {
      console.error("Delete tour image error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to delete image",
      });
    }
  }

  /**
   * Get optimized image URL
   */
  async getOptimizedImageUrl(req, res) {
    try {
      const { publicId, width, height, quality } = req.query;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: "Public ID is required",
        });
      }

      const options = {};
      if (width) options.width = parseInt(width);
      if (height) options.height = parseInt(height);
      if (quality) options.quality = quality;

      const url = CloudinaryService.getOptimizedImageUrl(publicId, options);

      return res.status(200).json({
        success: true,
        data: { url },
      });
    } catch (error) {
      console.error("Get optimized URL error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get optimized URL",
      });
    }
  }

  /**
   * Get thumbnail URL
   */
  async getThumbnailUrl(req, res) {
    try {
      const { publicId, width, height } = req.query;

      if (!publicId) {
        return res.status(400).json({
          success: false,
          message: "Public ID is required",
        });
      }

      const thumbnailWidth = width ? parseInt(width) : 300;
      const thumbnailHeight = height ? parseInt(height) : 300;

      const url = CloudinaryService.getThumbnail(
        publicId,
        thumbnailWidth,
        thumbnailHeight
      );

      return res.status(200).json({
        success: true,
        data: { url },
      });
    } catch (error) {
      console.error("Get thumbnail URL error:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Failed to get thumbnail URL",
      });
    }
  }
}

module.exports = new UploadController();
