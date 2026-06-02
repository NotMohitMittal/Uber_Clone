const mongoose = require("mongoose");

const rideSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    captain: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Captain",
    },
    pickup: {
      type: String,
      required: true,
    },
    destination: {
      type: String,
      required: true,
    },
    fare: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "accepted", "ongoing", "completed", "cancelled"],
      default: "pending",
    },
    duration: {
      type: Number, // --> in second
    },
    distance: {
      type: Number, // --> in meter
    },
    paymentId: {
      type: String,
    },
    orderId: {
      type: String,
    },
    otp: {
      type: String,
      select: false,
      // required: true,  // this is causing the issue during the ride creation
    },
  },
  { timestamps: true },
);

rideSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.user_password;
    delete ret.__v;
    return ret;
  },
});

const rideModel = mongoose.model("Ride", rideSchema);

module.exports = rideModel;
