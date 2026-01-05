const API_BASE_URL = "http://localhost:5000/api";

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
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Something went wrong");
      }

      return data;
    } catch (error) {
      throw error;
    }
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
}
