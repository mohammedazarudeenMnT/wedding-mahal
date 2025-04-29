import mongoose from "mongoose";

const roomSettingsSchema = new mongoose.Schema(
  {
    checkIn: {
      type: String,
      required: [true, "Check-in time is required"],
      validate: {
        validator: function (v) {
          // Validate time format (HH:MM)
          return /^([01]\d|2[0-3]):00$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format. Use HH:00 format.`,
      },
    },
    checkOut: {
      type: String,
      required: [true, "Check-out time is required"],
      validate: {
        validator: function (v) {
          // Validate time format (HH:MM)
          return /^([01]\d|2[0-3]):00$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid time format. Use HH:00 format.`,
      },
    },
    weekend: {
      type: [String],
      required: [true, "Weekend days are required"],
      validate: {
        validator: function (v) {
          const validDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          return v.every((day) => validDays.includes(day));
        },
        message: (props) =>
          `${props.value} contains invalid day(s). Use Sun, Mon, Tue, Wed, Thu, Fri, Sat.`,
      },
    },
    weekendPriceHike: {
      type: Number,
      required: [true, "Weekend price hike percentage is required"],
      min: [0, "Weekend price hike cannot be negative"],
      max: [100, "Weekend price hike cannot exceed 100%"],
    },
    housekeepingBuffer: {
      type: Number,
      required: function () {
        return !this.manualControl;
      },
      min: [1, "Buffer time must be at least 1 hour"],
      max: [4, "Buffer time cannot exceed 4 hours"],
      default: 1,
    },
    manualControl: {
      type: Boolean,
      default: false,
    },
    maxStayHours: {
      type: Number,
      required: [true, "Maximum stay duration in hours is required"],
      min: [20, "Stay duration must be at least 20 hours"],
      max: [23, "Stay duration cannot exceed 23 hours"],
      default: 23,
    },
  },
  {
    timestamps: true,
  }
);

roomSettingsSchema.pre("save", function (next) {
  if (this.manualControl) {
    this.housekeepingBuffer = null;
    return next();
  }

  const [checkInHour] = this.checkIn.split(":").map(Number);
  const [checkOutHour] = this.checkOut.split(":").map(Number);

  // Calculate stay duration for next day checkout
  const stayHours = 24 - checkInHour + checkOutHour;
  const bufferHours = 24 - stayHours;

  if (stayHours > 23) {
    return next(new Error("Stay duration cannot exceed 23 hours"));
  }

  this.maxStayHours = stayHours;
  this.housekeepingBuffer = bufferHours;

  next();
});

roomSettingsSchema.pre("findOneAndUpdate", async function (next) {
  const update = this.getUpdate();
  if (update.$set && update.$set.manualControl === true) {
    update.$set.housekeepingBuffer = null;
  } else if (update.$set && update.$set.manualControl === false) {
    // Get the updated check-in and check-out times
    const checkIn =
      update.$set.checkIn ||
      (await this.model.findOne(this.getQuery())).checkIn;
    const checkOut =
      update.$set.checkOut ||
      (await this.model.findOne(this.getQuery())).checkOut;

    const [checkInHour] = checkIn.split(":").map(Number);
    const [checkOutHour] = checkOut.split(":").map(Number);

    const stayHours = 24 - checkInHour + checkOutHour;
    update.$set.housekeepingBuffer = 24 - stayHours;
    update.$set.maxStayHours = stayHours;
  }
  next();
});

roomSettingsSchema.methods.calculateHours = function () {
  const [checkInHour] = this.checkIn.split(":").map(Number);
  const [checkOutHour] = this.checkOut.split(":").map(Number);
  const stayHours = 24 - checkInHour + checkOutHour;
  return {
    stayHours: stayHours,
    bufferHours: 24 - stayHours,
  };
};

export default roomSettingsSchema;
