const API_BASE_URL = "https://tour-booking-1-wbjc.onrender.com/api";

class API {
  // Helper method to make requests
  static async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const config = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    };

    // Add token if exists
    const token = localStorage.getItem("idToken");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, config);

      // Check if response has content
      const text = await response.text();

      if (!text) {
        throw new Error("Empty response from server");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Invalid JSON response from server");
      }

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      return data;
    } catch (error) {
      console.error("API Request Error:", error);
      throw error;
    }
  }

  // Helper method for file uploads (without Content-Type header)
  static async uploadRequest(endpoint, formData, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem("idToken");

    const config = {
      method: "POST",
      body: formData,
      ...options,
    };

    // Add token if exists (don't set Content-Type for FormData)
    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`,
        ...options.headers,
      };
    }

    try {
      const response = await fetch(url, config);

      // Check if response has content
      const text = await response.text();

      if (!text) {
        throw new Error("Empty response from server");
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Invalid JSON response from server");
      }

      if (!response.ok) {
        throw new Error(data.message || "Upload failed");
      }

      return data;
    } catch (error) {
      console.error("Upload Request Error:", error);
      throw error;
    }
  }

  // HTTP Helper Methods
  static async get(endpoint) {
    return this.request(endpoint, {
      method: "GET",
    });
  }

  static async post(endpoint, data) {
    return this.request(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  static async put(endpoint, data) {
    return this.request(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  static async patch(endpoint, data) {
    return this.request(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  static async delete(endpoint) {
    return this.request(endpoint, {
      method: "DELETE",
    });
  }

  // Auth endpoints
  static async login(email, password) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  static async register(userData) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    });
  }

  static async loginWithGoogle(idToken) {
    return this.request("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
  }

  static async getCurrentUser() {
    return this.request("/auth/me", {
      method: "GET",
    });
  }

  static async updateProfile(profileData) {
    return this.request("/auth/profile", {
      method: "PUT",
      body: JSON.stringify(profileData),
    });
  }

  static async signOut() {
    return this.request("/auth/sign-out", {
      method: "POST",
    });
  }

  // Upload endpoints
  static async uploadAvatar(file, userId = null) {
    try {
      // Validate file
      if (!file) {
        throw new Error("No file provided");
      }

      // Check file type
      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(
          "Invalid file type. Only JPEG, PNG, and WebP are allowed"
        );
      }

      // Check file size (10MB)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        throw new Error("File size exceeds 10MB limit");
      }

      const formData = new FormData();
      formData.append("avatar", file);

      // If userId is provided, use admin route to upload for specific user
      const endpoint = userId ? `/uploads/avatar/${userId}` : "/uploads/avatar";

      return this.uploadRequest(endpoint, formData);
    } catch (error) {
      console.error("Upload Avatar Error:", error);
      throw error;
    }
  }

  static async uploadDestinationImages(destinationId, files) {
    try {
      // Validate files
      if (!files || files.length === 0) {
        throw new Error("No files provided");
      }

      if (files.length > 10) {
        throw new Error("Maximum 10 files allowed");
      }

      const allowedTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/webp",
      ];
      const maxSize = 10 * 1024 * 1024;

      // Validate each file
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        if (!allowedTypes.includes(file.type)) {
          throw new Error(
            `File ${
              i + 1
            }: Invalid file type. Only JPEG, PNG, and WebP are allowed`
          );
        }

        if (file.size > maxSize) {
          throw new Error(`File ${i + 1}: File size exceeds 10MB limit`);
        }
      }

      const formData = new FormData();

      // Add multiple files
      for (let i = 0; i < files.length; i++) {
        formData.append("images", files[i]);
      }

      return this.uploadRequest(
        `/uploads/destinations/${destinationId}/images`,
        formData
      );
    } catch (error) {
      console.error("Upload Destination Images Error:", error);
      throw error;
    }
  }

  static async deleteDestinationImage(destinationId, publicId) {
    return this.request(`/uploads/destinations/${destinationId}/image`, {
      method: "DELETE",
      body: JSON.stringify({ publicId }),
    });
  }

  static async deleteMultipleDestinationImages(destinationId, publicIds) {
    return this.request(`/uploads/destinations/${destinationId}/images`, {
      method: "DELETE",
      body: JSON.stringify({ publicIds }),
    });
  }

  static async getOptimizedImageUrl(publicId, options = {}) {
    const params = new URLSearchParams({ publicId, ...options });
    return this.request(`/uploads/optimize?${params}`);
  }

  static async getThumbnailUrl(publicId, width = 300, height = 300) {
    const params = new URLSearchParams({ publicId, width, height });
    return this.request(`/uploads/thumbnail?${params}`);
  }
}

// Export for use in other files
if (typeof module !== "undefined" && module.exports) {
  module.exports = API;
}
