import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: {
      type: String,
      required: true,
      unique: true,
    },
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guest",
      required: true,
    },
    bookingNumber: {
      type: String,
      required: true,
    },
    customerDetails: {
      name: String,
      email: String,
      phone: String,
      address: String,
    },
    hotelDetails: {
      name: String,
      gstNo: String,
      address: String,
      email: String,
      phone: String,
    },
    stayDetails: {
      checkIn: Date,
      checkOut: Date,
      numberOfNights: Number,
      numberOfRooms: Number,
      numberOfGuests: {
        adults: Number,
        children: Number,
      },
    },
    rooms: [
      {
        roomNumber: String,
        roomType: String,
        ratePerNight: Number,
        additionalGuestCharge: Number,
        taxes: {
          cgst: Number,
          sgst: Number,
          igst: Number,
        },
        totalAmount: Number,
      },
    ],
    paymentDetails: {
      method: {
        type: String,
        enum: ["online", "cod", "qr", "paymentLink"],
      },
      status: {
        type: String,
        enum: ["pending", "completed", "failed"],
      },
      razorpayOrderId: String,
      razorpayPaymentId: String,
      razorpayPaymentLinkId: String,
      razorpayQrCodeId: String,
    },
    amounts: {
      subtotal: Number,
      totalTax: Number,
      totalAmount: Number,
      discount: {
        type: Number,
        default: 0,
      },
      discountAmount: {
        type: Number,
        default: 0,
      },
      servicesCharge: {
        type: Number,
        default: 0,
      },
    },
    selectedServices: [
      {
        name: String,
        price: Number,
        quantity: {
          type: Number,
          default: 1,
        },
        totalAmount: Number,
      },
    ],
    transactions: {
      totalPaid: Number,
      payableAmount: Number,
      isFullyPaid: {
        type: Boolean,
        default: false,
      },
      payments: [
        {
          paymentMethod: String,
          amount: Number,
          transactionId: String,
          paymentDate: Date,
          remarks: String,
          bank: String,
          paymentType: String,
          razorpayPaymentLinkId: String,
          status: String,
          paymentNumber: Number,
        },
      ],
    },
  },
  { timestamps: true }
);

export default invoiceSchema;
