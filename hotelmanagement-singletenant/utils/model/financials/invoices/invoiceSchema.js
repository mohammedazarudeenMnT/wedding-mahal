import mongoose from "mongoose";

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Guest',
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
    address: String
  },
  hotelDetails: {
    name: String,
    gstNo: String,
    address: String,
    email: String,
    phone: String
  },
  stayDetails: {
    checkIn: Date,
    checkOut: Date,
    numberOfNights: Number,
    numberOfRooms: Number,
    numberOfGuests: {
      adults: Number,
      children: Number
    }
  },
  rooms: [{
    roomNumber: String,
    roomType: String,
    ratePerNight: Number,
    additionalGuestCharge: Number,
    taxes: {
      cgst: Number,
      sgst: Number,
      igst: Number
    },
    totalAmount: Number
  }],
  paymentDetails: {
    method: {
      type: String,
      enum: ['online', 'cod', 'qr', 'paymentLink']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed']
    },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpayPaymentLinkId: String,
    razorpayQrCodeId: String
  },
  amounts: {
    subtotal: Number,
    totalTax: Number,
    totalAmount: Number
  }
}, { timestamps: true });

export default invoiceSchema;
