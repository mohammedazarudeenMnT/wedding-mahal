import mongoose from "mongoose";

const GuestSchema = new mongoose.Schema(
  {
    bookingNumber: {
      type: String,
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      required: true,
    },
    lastName: {
      type: String,
      required: true,
    },
    mobileNo: {
      type: String,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
    },
    dateOfBirth: {
      type: Date,
    },
    email: {
      type: String,
      required: true,
    },
    nationality: {
      type: String,
    },
    verificationType: {
      type: String,
    },
    verificationId: {
      type: String,
    },
    address: {
      type: String,
    },
    checkInDate: {
      type: Date,
      required: true,
    },
    checkOutDate: {
      type: Date,
      required: true,
    },
    numberOfRooms: {
      type: Number,
      default: 1,
    },
    status: { type: String, default: "booked" },
    guests: {
      adults: {
        type: Number,
        required: true,
      },
      children: {
        type: Number,
        required: true,
      },
    },
    rooms: [
      {
        type: {
          type: String,
          required: true,
        },
        number: {
          type: String,
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        igst: {
          type: Number,
          required: true,
        },
        additionalGuestCharge: {
          type: Number,
          default: 0,
        },
        totalAmount: {
          type: Number,
          required: true,
        },
        mainImage: {
          type: String,
          required: true,
        },
      },
    ],
    totalAmount: {
      roomCharge: {
        type: Number,
        required: true,
      },
      taxes: {
        type: Number,
        required: true,
      },
      additionalGuestCharge: {
        type: Number,
        required: true,
      },
      total: {
        type: Number,
        required: true,
      },
    },
    roomNumbers: [String], // Added field for room numbers
    uploadedFiles: [
      {
        fileName: {
          type: String,
          required: true,
        },
        filePath: {
          type: String,
          required: true,
        },
        uploadDate: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    clientRequests: String,
    notes: String,
    // Razorpay payment information
    paymentMethod: {
      type: String,
      enum: ["online", "cod", "qr", "paymentLink"],
      required: true,
    },
    razorpayOrderId: {
      type: String,
    },
    razorpayPaymentId: {
      type: String,
    },
    razorpaySignature: {
      type: String,
    },
    razorpayAmount: {
      type: Number,
    },
    razorpayCurrency: {
      type: String,
    },
    razorpayPaymentLinkId: {
      type: String,
    },
    razorpayQrCodeId: {
      type: String,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    invoiceNumber: {
      type: String,
      sparse: true, // Allows null/undefined values while still maintaining uniqueness
      unique: true,
    },
    statusTimestamps: {
      booked: { type: Date },
      checkin: { type: Date },
      checkout: { type: Date },
      cancelled: { type: Date },
    },
    guestId: {
      type: String,
      sparse: true, // Allows null/undefined while maintaining uniqueness
    },
  },
  {
    timestamps: true,
  }
);

export default GuestSchema;
