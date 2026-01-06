const TourModel = require("../models/tour.model");
const { TOUR_STATUS } = require("../utils/constants");

const tours = [
  {
    name: "Ha Long Bay Luxury Cruise - 2 Days 1 Night",
    slug: "ha-long-bay-luxury-cruise-2d1n",
    description:
      "Experience the breathtaking beauty of Ha Long Bay aboard a luxury cruise. Enjoy kayaking, cave exploration, and stunning sunset views over the emerald waters.",
    destinationId: null,
    destinations: [],
    duration: {
      days: 2,
      nights: 1,
    },
    price: {
      adult: 3500000,
      child: 2500000,
      infant: 0,
    },
    itinerary: [
      {
        day: 1,
        title: "Hanoi - Ha Long Bay - Cruise Activities",
        activities: [
          "Pick up from Hanoi hotel",
          "Transfer to Ha Long Bay (3.5 hours)",
          "Board luxury cruise ship",
          "Welcome lunch on board",
          "Visit Sung Sot Cave",
          "Kayaking at Luon Cave",
          "Sunset party on sundeck",
          "Dinner and overnight on cruise",
        ],
      },
      {
        day: 2,
        title: "Tai Chi - Cooking Class - Return to Hanoi",
        activities: [
          "Tai Chi session on sundeck",
          "Breakfast on board",
          "Vietnamese cooking class",
          "Visit fishing village",
          "Brunch while cruising back",
          "Disembark and return to Hanoi",
        ],
      },
    ],
    maxGroupSize: 20,
    minGroupSize: 2,
    difficulty: "easy",
    tourType: "cruise",
    includes: [
      "Luxury cruise accommodation",
      "All meals on board",
      "English speaking guide",
      "Kayaking equipment",
      "Entrance fees",
      "Round-trip transfer from Hanoi",
    ],
    excludes: [
      "Personal expenses",
      "Tips and gratuities",
      "Travel insurance",
      "Drinks and beverages",
    ],
    requirements: [
      "Passport copy",
      "Good physical health",
      "Comfortable walking shoes",
    ],
    images: [
      "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80",
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80",
    ],
    coverImage:
      "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
    availableDates: [
      {
        startDate: "2025-02-15",
        endDate: "2025-02-16",
        availableSlots: 15,
        price: 3500000,
      },
      {
        startDate: "2025-03-01",
        endDate: "2025-03-02",
        availableSlots: 20,
        price: 3500000,
      },
      {
        startDate: "2025-03-15",
        endDate: "2025-03-16",
        availableSlots: 18,
        price: 3800000,
      },
    ],
    status: TOUR_STATUS.ACTIVE,
    featured: true,
  },
  {
    name: "Sapa Trekking & Homestay - 3 Days 2 Nights",
    slug: "sapa-trekking-homestay-3d2n",
    description:
      "Trek through stunning rice terraces, visit ethnic minority villages, and experience authentic homestay with local families in the beautiful mountains of Sapa.",
    destinationId: null,
    destinations: [],
    duration: {
      days: 3,
      nights: 2,
    },
    price: {
      adult: 2800000,
      child: 2000000,
      infant: 0,
    },
    itinerary: [
      {
        day: 1,
        title: "Hanoi - Sapa - Cat Cat Village",
        activities: [
          "Night train from Hanoi to Lao Cai",
          "Breakfast in Sapa town",
          "Trek to Cat Cat village",
          "Visit H'mong ethnic minority",
          "Lunch with local family",
          "Continue trekking through rice terraces",
          "Homestay dinner and overnight",
        ],
      },
      {
        day: 2,
        title: "Lao Chai - Ta Van Villages",
        activities: [
          "Breakfast at homestay",
          "Trek to Lao Chai village",
          "Visit Black H'mong families",
          "Lunch in Ta Van village",
          "Explore Dzay minority culture",
          "Return to homestay",
          "Traditional dinner and cultural show",
        ],
      },
      {
        day: 3,
        title: "Sapa Market - Return to Hanoi",
        activities: [
          "Visit Sapa local market",
          "Free time for shopping",
          "Lunch in Sapa town",
          "Transfer to Lao Cai station",
          "Night train back to Hanoi",
        ],
      },
    ],
    maxGroupSize: 12,
    minGroupSize: 2,
    difficulty: "moderate",
    tourType: "trekking",
    includes: [
      "Train tickets (Hanoi - Lao Cai - Hanoi)",
      "Homestay accommodation",
      "All meals during trek",
      "English speaking guide",
      "Trekking permits",
      "Transfers in Sapa",
    ],
    excludes: [
      "Hotel in Hanoi",
      "Personal expenses",
      "Travel insurance",
      "Tips for guide and driver",
    ],
    requirements: [
      "Good physical condition",
      "Trekking shoes",
      "Rain jacket",
      "Sun protection",
    ],
    images: [
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80",
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80",
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80",
    ],
    coverImage:
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80",
    availableDates: [
      {
        startDate: "2025-02-20",
        endDate: "2025-02-22",
        availableSlots: 10,
        price: 2800000,
      },
      {
        startDate: "2025-03-10",
        endDate: "2025-03-12",
        availableSlots: 12,
        price: 2800000,
      },
    ],
    status: TOUR_STATUS.ACTIVE,
    featured: true,
  },
  {
    name: "Hoi An Ancient Town & My Son Sanctuary - 2 Days",
    slug: "hoi-an-ancient-town-my-son-2d",
    description:
      "Explore the charming ancient town of Hoi An and the mystical My Son Sanctuary, a UNESCO World Heritage site with ancient Cham temples.",
    destinationId: null,
    destinations: [],
    duration: {
      days: 2,
      nights: 1,
    },
    price: {
      adult: 2200000,
      child: 1500000,
      infant: 0,
    },
    itinerary: [
      {
        day: 1,
        title: "Hoi An Ancient Town Exploration",
        activities: [
          "Pick up from Da Nang hotel",
          "Transfer to Hoi An (30 minutes)",
          "Walking tour of ancient town",
          "Visit Japanese Covered Bridge",
          "Explore old merchant houses",
          "Lunch at local restaurant",
          "Lantern making workshop",
          "Free time for shopping",
          "Dinner and overnight in Hoi An",
        ],
      },
      {
        day: 2,
        title: "My Son Sanctuary - Return to Da Nang",
        activities: [
          "Early breakfast",
          "Transfer to My Son Sanctuary",
          "Guided tour of Cham temples",
          "Traditional Cham dance performance",
          "Lunch at local restaurant",
          "Return to Da Nang",
          "Drop off at hotel",
        ],
      },
    ],
    maxGroupSize: 15,
    minGroupSize: 2,
    difficulty: "easy",
    tourType: "cultural",
    includes: [
      "Hotel accommodation in Hoi An",
      "All meals mentioned",
      "English speaking guide",
      "Entrance fees",
      "Transfers",
      "Lantern making class",
    ],
    excludes: [
      "Personal expenses",
      "Tips and gratuities",
      "Travel insurance",
      "Additional meals",
    ],
    requirements: ["Comfortable walking shoes", "Sun protection", "Camera"],
    images: [
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80",
      "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80",
      "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
    ],
    coverImage:
      "https://images.unsplash.com/photo-1583417319070-4a69db38a482?w=800&q=80",
    availableDates: [
      {
        startDate: "2025-02-18",
        endDate: "2025-02-19",
        availableSlots: 12,
        price: 2200000,
      },
      {
        startDate: "2025-03-05",
        endDate: "2025-03-06",
        availableSlots: 15,
        price: 2200000,
      },
    ],
    status: TOUR_STATUS.ACTIVE,
    featured: true,
  },
  {
    name: "Mekong Delta Discovery - 1 Day",
    slug: "mekong-delta-discovery-1d",
    description:
      "Discover the vibrant life along the Mekong Delta, visit floating markets, fruit orchards, and experience traditional boat rides through narrow canals.",
    destinationId: null,
    destinations: [],
    duration: {
      days: 1,
      nights: 0,
    },
    price: {
      adult: 1200000,
      child: 800000,
      infant: 0,
    },
    itinerary: [
      {
        day: 1,
        title: "Mekong Delta Full Day Tour",
        activities: [
          "Pick up from Ho Chi Minh City hotel (7:00 AM)",
          "Transfer to My Tho (2 hours)",
          "Visit Vinh Trang Pagoda",
          "Boat trip on Mekong River",
          "Visit fruit orchards and taste tropical fruits",
          "Lunch at local restaurant",
          "Sampan ride through narrow canals",
          "Visit coconut candy workshop",
          "Traditional music performance",
          "Return to Ho Chi Minh City (6:00 PM)",
        ],
      },
    ],
    maxGroupSize: 25,
    minGroupSize: 2,
    difficulty: "easy",
    tourType: "day-trip",
    includes: [
      "Round-trip transfer",
      "Lunch",
      "English speaking guide",
      "Boat trips",
      "Entrance fees",
      "Fruit tasting",
    ],
    excludes: [
      "Personal expenses",
      "Tips and gratuities",
      "Travel insurance",
      "Drinks",
    ],
    requirements: ["Sun hat", "Sunscreen", "Comfortable shoes"],
    images: [
      "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80",
      "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80",
    ],
    coverImage:
      "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80",
    availableDates: [
      {
        startDate: "2025-02-10",
        endDate: "2025-02-10",
        availableSlots: 20,
        price: 1200000,
      },
      {
        startDate: "2025-02-17",
        endDate: "2025-02-17",
        availableSlots: 25,
        price: 1200000,
      },
      {
        startDate: "2025-02-24",
        endDate: "2025-02-24",
        availableSlots: 22,
        price: 1200000,
      },
    ],
    status: TOUR_STATUS.ACTIVE,
    featured: false,
  },
  {
    name: "Phong Nha Cave Adventure - 2 Days 1 Night",
    slug: "phong-nha-cave-adventure-2d1n",
    description:
      "Explore the magnificent Phong Nha-Ke Bang National Park, home to the world's largest caves. Visit Paradise Cave and Phong Nha Cave by boat.",
    destinationId: null,
    destinations: [],
    duration: {
      days: 2,
      nights: 1,
    },
    price: {
      adult: 2500000,
      child: 1800000,
      infant: 0,
    },
    itinerary: [
      {
        day: 1,
        title: "Hue - Phong Nha - Paradise Cave",
        activities: [
          "Pick up from Hue hotel",
          "Transfer to Phong Nha (3 hours)",
          "Check-in at hotel",
          "Lunch at local restaurant",
          "Visit Paradise Cave (31km of stunning formations)",
          "Explore underground chambers",
          "Return to hotel",
          "Dinner and overnight in Phong Nha",
        ],
      },
      {
        day: 2,
        title: "Phong Nha Cave - Return to Hue",
        activities: [
          "Breakfast at hotel",
          "Boat trip to Phong Nha Cave",
          "Explore cave by boat and on foot",
          "Lunch at local restaurant",
          "Visit Dark Cave (optional)",
          "Transfer back to Hue",
        ],
      },
    ],
    maxGroupSize: 15,
    minGroupSize: 2,
    difficulty: "moderate",
    tourType: "adventure",
    includes: [
      "Hotel accommodation",
      "All meals mentioned",
      "English speaking guide",
      "Entrance fees",
      "Boat trips",
      "Transfers",
    ],
    excludes: [
      "Dark Cave activities (zip-line, kayaking)",
      "Personal expenses",
      "Travel insurance",
      "Tips",
    ],
    requirements: [
      "Good physical condition",
      "Comfortable walking shoes",
      "Flashlight",
      "Waterproof bag",
    ],
    images: [
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80",
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80",
      "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
    ],
    coverImage:
      "https://images.unsplash.com/photo-1559592413-7cec4d0cae2b?w=800&q=80",
    availableDates: [
      {
        startDate: "2025-02-22",
        endDate: "2025-02-23",
        availableSlots: 12,
        price: 2500000,
      },
      {
        startDate: "2025-03-08",
        endDate: "2025-03-09",
        availableSlots: 15,
        price: 2500000,
      },
    ],
    status: TOUR_STATUS.ACTIVE,
    featured: false,
  },
  {
    name: "Phu Quoc Island Paradise - 4 Days 3 Nights",
    slug: "phu-quoc-island-paradise-4d3n",
    description:
      "Relax on pristine beaches, snorkel in crystal clear waters, and explore the tropical paradise of Phu Quoc Island with its stunning sunsets and fresh seafood.",
    destinationId: null,
    destinations: [],
    duration: {
      days: 4,
      nights: 3,
    },
    price: {
      adult: 5500000,
      child: 4000000,
      infant: 0,
    },
    itinerary: [
      {
        day: 1,
        title: "Arrival in Phu Quoc - Beach Relaxation",
        activities: [
          "Pick up from Phu Quoc airport",
          "Transfer to resort",
          "Check-in and welcome drink",
          "Free time at beach",
          "Sunset watching at Long Beach",
          "Seafood dinner at night market",
        ],
      },
      {
        day: 2,
        title: "Island Hopping & Snorkeling",
        activities: [
          "Breakfast at resort",
          "Boat trip to An Thoi islands",
          "Snorkeling at coral reefs",
          "Lunch on boat",
          "Visit May Rut island",
          "Swimming and beach activities",
          "Return to resort",
          "Dinner at resort",
        ],
      },
      {
        day: 3,
        title: "Phu Quoc Exploration",
        activities: [
          "Breakfast at resort",
          "Visit Phu Quoc National Park",
          "Explore pepper farms",
          "Lunch at local restaurant",
          "Visit fish sauce factory",
          "Sunset at Dinh Cau Rock",
          "Dinner and free time",
        ],
      },
      {
        day: 4,
        title: "Departure",
        activities: [
          "Breakfast at resort",
          "Free time for last-minute shopping",
          "Check-out",
          "Transfer to airport",
        ],
      },
    ],
    maxGroupSize: 20,
    minGroupSize: 2,
    difficulty: "easy",
    tourType: "beach",
    includes: [
      "3-star resort accommodation",
      "Daily breakfast",
      "Island hopping tour with lunch",
      "Snorkeling equipment",
      "Airport transfers",
      "English speaking guide",
    ],
    excludes: [
      "Airfare to Phu Quoc",
      "Dinners (except day 1)",
      "Personal expenses",
      "Travel insurance",
      "Water sports activities",
    ],
    requirements: ["Swimwear", "Sunscreen", "Beach towel", "Camera"],
    images: [
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80",
      "https://images.unsplash.com/photo-1528127269322-539801943592?w=800&q=80",
      "https://images.unsplash.com/photo-1555400038-63f5ba517a47?w=800&q=80",
    ],
    coverImage:
      "https://images.unsplash.com/photo-1552465011-b4e21bf6e79a?w=800&q=80",
    availableDates: [
      {
        startDate: "2025-02-25",
        endDate: "2025-02-28",
        availableSlots: 15,
        price: 5500000,
      },
      {
        startDate: "2025-03-12",
        endDate: "2025-03-15",
        availableSlots: 18,
        price: 5800000,
      },
    ],
    status: TOUR_STATUS.ACTIVE,
    featured: true,
  },
];

const seedTours = async () => {
  try {
    console.log("🌱 Seeding tours...");

    // Import DestinationModel to fetch destinations
    const DestinationModel = require("../models/destination.model");

    // Fetch all destinations
    const haLong = await DestinationModel.findBySlug("ha-long");
    const sapa = await DestinationModel.findBySlug("sapa");
    const hoiAn = await DestinationModel.findBySlug("hoi-an");
    const phuQuoc = await DestinationModel.findBySlug("phu-quoc");
    const hue = await DestinationModel.findBySlug("hue");

    // Update tours with destination data
    const toursWithDestinations = [
      {
        ...tours[0], // Ha Long Bay Cruise
        destinationId: haLong?.id || null,
        destinations: haLong ? [{ id: haLong.id, name: haLong.name }] : [],
      },
      {
        ...tours[1], // Sapa Trekking
        destinationId: sapa?.id || null,
        destinations: sapa ? [{ id: sapa.id, name: sapa.name }] : [],
      },
      {
        ...tours[2], // Hoi An
        destinationId: hoiAn?.id || null,
        destinations: hoiAn ? [{ id: hoiAn.id, name: hoiAn.name }] : [],
      },
      {
        ...tours[3], // Mekong Delta (no specific destination in our list)
        destinationId: null,
        destinations: [],
      },
      {
        ...tours[4], // Phong Nha (near Hue)
        destinationId: hue?.id || null,
        destinations: hue ? [{ id: hue.id, name: hue.name }] : [],
      },
      {
        ...tours[5], // Phu Quoc
        destinationId: phuQuoc?.id || null,
        destinations: phuQuoc ? [{ id: phuQuoc.id, name: phuQuoc.name }] : [],
      },
    ];

    for (const tourData of toursWithDestinations) {
      const exists = await TourModel.findBySlug(tourData.slug);

      if (!exists) {
        await TourModel.create(tourData);
        console.log(`✅ Created tour: ${tourData.name}`);
      } else {
        console.log(`⏭️  Tour already exists: ${tourData.name}`);
      }
    }

    console.log("✅ Tours seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding tours:", error);
    throw error;
  }
};

module.exports = seedTours;
