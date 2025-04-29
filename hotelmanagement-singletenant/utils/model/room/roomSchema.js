import mongoose from "mongoose";

// Define the schema for the amenities
const amenitySchema = new mongoose.Schema(
  {
    icon: { type: String, required: true },
    name: { type: String, required: true },
  },
  { _id: false } // Disable automatic creation of an _id field for this sub-document
);

const bookedDateSchema = new mongoose.Schema(
  {
    bookingNumber: { type: String, required: false },
    checkIn: { type: Date, required: false },
    checkOut: { type: Date, required: false },
    status: { type: String, default: "available" },
    guests: {
      adults: {
        type: Number,
      },
      children: {
        type: Number,
      },
    },
  },
  { _id: false }
);
// Define the schema for each room number with status
const roomNumberSchema = new mongoose.Schema(
  {
    number: { type: String, required: true }, // Room number (e.g., "101")
    bookeddates: [bookedDateSchema],
  },
  { _id: false }
);

// Define the schema for the Room
const roomSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // Room name (e.g., "Deluxe Room")

    description: { type: String, required: true }, // Room description
    igst: { type: String, required: true }, // IGST
    additionalGuestCosts: { type: String, required: true }, // Additional guest costs
    mainImage: { type: String, required: true }, // URL of the main image
    thumbnailImages: { type: [String], default: [] }, // Array of URLs for thumbnail images
    price: { type: Number, required: true }, // Room price
    size: { type: String, required: true }, // Room size (e.g., "35 m²")
    bedModel: { type: String, required: true }, // Bed model (e.g., "King Size")
    maxGuests: { type: Number, required: true }, // Maximum number of guests
    roomNumbers: { type: [roomNumberSchema], required: true }, // Array of room numbers with status
    numberOfRooms: { type: Number, required: true }, // Total number of rooms of this type
    complementaryFoods: { type: [String], default: [] }, // Array of complementary foods
    amenities: { type: [amenitySchema], default: [] }, // Array of amenities
    createdAt: { type: Date, default: Date.now }, // Timestamp of when the room was created
  },
  {
    timestamps: true,
  }
);

// Create the model for the room

export default roomSchema;
