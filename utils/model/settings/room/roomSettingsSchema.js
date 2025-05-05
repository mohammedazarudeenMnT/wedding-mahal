import mongoose from "mongoose";

const roomSettingsSchema = new mongoose.Schema(
  {
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
    propertyTypes: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    eventTypes: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    timeSlots: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        fromTime: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return /^([01]\d|2[0-3]):00$/.test(v);
            },
            message: (props) =>
              `${props.value} is not a valid time format. Use HH:00 format.`,
          },
        },
        toTime: {
          type: String,
          required: true,
          validate: {
            validator: function (v) {
              return /^([01]\d|2[0-3]):00$/.test(v);
            },
            message: (props) =>
              `${props.value} is not a valid time format. Use HH:00 format.`,
          },
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

export default roomSettingsSchema;
