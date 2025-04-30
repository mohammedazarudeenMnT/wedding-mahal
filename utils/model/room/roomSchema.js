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
    name: { type: String, required: true },
    description: { type: String, required: true },
    igst: { type: String, required: true },
    additionalGuestCosts: {
      type: String,
      required: function () {
        return this.type === "Room";
      },
    },
    mainImage: { type: String, required: true },
    thumbnailImages: { type: [String], default: [] },
    price: { type: Number, required: true },
    size: { type: String, required: true },
    capacity: {
      type: Number,
      required: function () {
        return this.type === "Hall";
      },
    },
    bedModel: {
      type: String,
      required: function () {
        return this.type === "Room";
      },
    },
    maxGuests: {
      type: Number,
      required: function () {
        return this.type === "Room";
      },
    },
    roomNumbers: {
      type: [roomNumberSchema],
      required: function () {
        return this.type === "Room";
      },
      default: undefined, // This prevents empty array from being created
    },
    hallNumbers: {
      type: [roomNumberSchema],
      required: function () {
        return this.type === "Hall";
      },
      default: undefined, // This prevents empty array from being created
    },
    numberOfRooms: {
      type: Number,
      required: function () {
        return this.type === "Room";
      },
    },
    numberOfHalls: {
      type: Number,
      required: function () {
        return this.type === "Hall";
      },
    },
    type: {
      type: String,
      enum: ["Room", "Hall"],
      required: true,
      default: "Room",
    },
    complementaryFoods: {
      type: [String],
    },
    amenities: { type: [amenitySchema], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
  }
);

// Add a pre-save middleware to clean up unused fields
roomSchema.pre("save", function (next) {
  if (this.type === "Room") {
    this.hallNumbers = undefined;
    this.capacity = undefined;
    this.numberOfHalls = undefined;
  } else if (this.type === "Hall") {
    this.roomNumbers = undefined;
    this.bedModel = undefined;
    this.maxGuests = undefined;
    this.numberOfRooms = undefined;
    this.additionalGuestCosts = undefined;
  }
  next();
});

export default roomSchema;
