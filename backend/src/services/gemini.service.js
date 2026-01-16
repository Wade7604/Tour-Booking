const { GoogleGenerativeAI } = require("@google/generative-ai");
const TourService = require("./tour.service");
const DestinationService = require("./destination.service");

class GeminiService {
  constructor() {
    this.genAI = null;
    this.model = null;
    this.toursCache = null;
    this.destinationsCache = null;
    this.cacheExpiry = null;
    this.CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  }

  // Initialize Gemini AI
  _initializeGemini() {
    if (!this.genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("GEMINI_API_KEY is not configured");
      }
      
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    }
    return this.model;
  }

  // Fetch and cache tours data
  async _getToursData() {
    const now = Date.now();
    if (this.toursCache && this.cacheExpiry && now < this.cacheExpiry) {
      return this.toursCache;
    }

    try {
      const result = await TourService.getAllTours({ 
        status: "active", 
        limit: 100 
      });
      
      // Format tours for AI context
      this.toursCache = result.tours.map(tour => ({
        id: tour.id,
        name: tour.name,
        slug: tour.slug,
        description: tour.description,
        duration: tour.duration,
        price: tour.price,
        difficulty: tour.difficulty,
        tourType: tour.tourType,
        maxGroupSize: tour.maxGroupSize,
        includes: tour.includes,
        destination: tour.destination?.name || null,
        destinationId: tour.destinationId,
        featured: tour.featured,
        availableDates: tour.availableDates?.map(d => ({
          startDate: d.startDate,
          endDate: d.endDate,
          availableSlots: d.availableSlots,
          price: d.price
        }))
      }));

      this.cacheExpiry = now + this.CACHE_DURATION;
      return this.toursCache;
    } catch (error) {
      console.error("Error fetching tours for Gemini:", error);
      return [];
    }
  }

  // Fetch and cache destinations data
  async _getDestinationsData() {
    const now = Date.now();
    if (this.destinationsCache && this.cacheExpiry && now < this.cacheExpiry) {
      return this.destinationsCache;
    }

    try {
      const result = await DestinationService.getAllDestinations(1, 100, { status: "active" });
      
      // Format destinations for AI context
      this.destinationsCache = result.destinations.map(dest => ({
        id: dest.id,
        name: dest.name,
        slug: dest.slug,
        description: dest.description,
        country: dest.country,
        city: dest.city
      }));

      this.cacheExpiry = now + this.CACHE_DURATION;
      return this.destinationsCache;
    } catch (error) {
      console.error("Error fetching destinations for Gemini:", error);
      return [];
    }
  }

  // Build context for AI
  async _buildContext() {
    const [tours, destinations] = await Promise.all([
      this._getToursData(),
      this._getDestinationsData()
    ]);

    return {
      tours,
      destinations,
      systemPrompt: `You are an intelligent travel assistant for TourBooking, a professional travel company in Vietnam.

## Available Data:

### DESTINATIONS (${destinations.length} locations):
${destinations.map(d => `- ${d.name} [slug: ${d.slug}] (${d.city}, ${d.country}): ${d.description?.substring(0, 100) || 'Attractive destination'}...`).join('\n')}

### TOURS (${tours.length} tours):
${tours.map(t => {
  const priceFormatted = t.price?.adult ? new Intl.NumberFormat('en-US').format(t.price.adult) + ' VND' : 'Contact us';
  const duration = t.duration ? `${t.duration.days} days ${t.duration.nights} nights` : '';
  return `- ${t.name} [slug: ${t.slug}]
  + Duration: ${duration}
  + Price: ${priceFormatted}/adult
  + Difficulty: ${t.difficulty || 'Easy'}
  + Type: ${t.tourType || 'Tour'}
  + Destination: ${t.destination || 'Multiple locations'}
  + Description: ${t.description?.substring(0, 150) || ''}...`;
}).join('\n\n')}

## Response Guidelines:
1. When users ask about tours or destinations, suggest suitable tours/destinations from the above list
2. When suggesting tours, always include: tour name, duration, price, and highlights
3. For adventure seekers, suggest tours with "moderate" or "challenging" difficulty
4. For family/relaxed trips, suggest tours with "easy" difficulty
5. IMPORTANT: When making suggestions, you MUST use the EXACT slug shown in [slug: xxx] - do NOT modify or generate your own slug
6. Respond in English, be friendly and professional
7. If no exact match is found, suggest similar tours and explain why

## Tour Suggestion Format (JSON in response):
When suggesting tours, include the following JSON block. IMPORTANT: Use the EXACT slug from the data above, do not create your own:
\`\`\`suggestions
{
  "tours": [{"slug": "exact-slug-from-data", "name": "Tour name", "reason": "Why it's suitable"}],
  "destinations": [{"slug": "exact-slug-from-data", "name": "Destination name", "reason": "Why it's suitable"}]
}
\`\`\`
`
    };
  }

  // Parse suggestions from AI response
  _parseSuggestions(text) {
    const suggestions = {
      tours: [],
      destinations: []
    };

    try {
      // Find JSON block in response
      const suggestionsMatch = text.match(/```suggestions\n?([\s\S]*?)\n?```/);
      if (suggestionsMatch) {
        const parsed = JSON.parse(suggestionsMatch[1]);
        if (parsed.tours) suggestions.tours = parsed.tours;
        if (parsed.destinations) suggestions.destinations = parsed.destinations;
      }
    } catch (error) {
      console.error("Error parsing suggestions:", error);
    }

    return suggestions;
  }

  // Clean response text (remove JSON block for display)
  _cleanResponseText(text) {
    return text.replace(/```suggestions\n?[\s\S]*?\n?```/g, '').trim();
  }

  // Main chat function
  async chat(message, conversationHistory = []) {
    try {
      const model = this._initializeGemini();
      const context = await this._buildContext();

      // Build conversation for Gemini
      const contents = [];

      // Add system context as first user message
      contents.push({
        role: "user",
        parts: [{ text: context.systemPrompt }]
      });

      // Add system acknowledgment
      contents.push({
        role: "model",
        parts: [{ text: "I understand. I'm TourBooking's travel assistant and I'll help you find the perfect tour. What kind of travel experience are you looking for?" }]
      });

      // Add conversation history
      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        });
      }

      // Add current message
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      // Generate response
      const result = await model.generateContent({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });

      const response = result.response;
      const text = response.text();

      // Parse suggestions and clean text
      const suggestions = this._parseSuggestions(text);
      const cleanText = this._cleanResponseText(text);

      return {
        success: true,
        message: cleanText,
        suggestions,
        context: {
          toursCount: context.tours.length,
          destinationsCount: context.destinations.length
        }
      };
    } catch (error) {
      console.error("Gemini chat error:", error);
      throw error;
    }
  }

  // Get quick suggestions based on user preferences
  async getQuickSuggestions(preferences = {}) {
    try {
      const { 
        budget, 
        duration, 
        difficulty, 
        tourType, 
        destination 
      } = preferences;

      const tours = await this._getToursData();
      const destinations = await this._getDestinationsData();

      let filteredTours = [...tours];

      // Filter by budget
      if (budget) {
        filteredTours = filteredTours.filter(t => 
          t.price?.adult && t.price.adult <= budget
        );
      }

      // Filter by duration
      if (duration) {
        filteredTours = filteredTours.filter(t => 
          t.duration?.days && t.duration.days <= duration
        );
      }

      // Filter by difficulty
      if (difficulty) {
        filteredTours = filteredTours.filter(t => 
          t.difficulty === difficulty
        );
      }

      // Filter by tour type
      if (tourType) {
        filteredTours = filteredTours.filter(t => 
          t.tourType === tourType
        );
      }

      // Filter by destination
      if (destination) {
        const destLower = destination.toLowerCase();
        filteredTours = filteredTours.filter(t => 
          t.destination?.toLowerCase().includes(destLower)
        );
      }

      // Sort by featured first
      filteredTours.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));

      // Return top 5 suggestions
      return {
        success: true,
        suggestions: {
          tours: filteredTours.slice(0, 5),
          destinations: destinations.slice(0, 5)
        },
        totalMatches: filteredTours.length
      };
    } catch (error) {
      console.error("Error getting quick suggestions:", error);
      throw error;
    }
  }

  // Chat with streaming (for future use)
  async chatStream(message, conversationHistory = [], onChunk) {
    try {
      const model = this._initializeGemini();
      const context = await this._buildContext();

      const contents = [];
      contents.push({
        role: "user",
        parts: [{ text: context.systemPrompt }]
      });
      contents.push({
        role: "model",
        parts: [{ text: "I understand. I'll help you find the perfect tour." }]
      });

      for (const msg of conversationHistory) {
        contents.push({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        });
      }

      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const result = await model.generateContentStream({
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      });

      let fullText = '';
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        fullText += chunkText;
        if (onChunk) {
          onChunk(chunkText);
        }
      }

      const suggestions = this._parseSuggestions(fullText);
      const cleanText = this._cleanResponseText(fullText);

      return {
        success: true,
        message: cleanText,
        suggestions
      };
    } catch (error) {
      console.error("Gemini stream error:", error);
      throw error;
    }
  }

  // Clear cache manually
  clearCache() {
    this.toursCache = null;
    this.destinationsCache = null;
    this.cacheExpiry = null;
  }
}

module.exports = new GeminiService();
