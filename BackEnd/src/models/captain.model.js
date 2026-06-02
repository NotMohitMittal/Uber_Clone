const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const captainSchema = mongoose.Schema(
  {
    fullName: {
      firstName: {
        type: String,
        required: true,
        minlength: [3, "first-name should have at least 3 characters"],
      },
      lastName: {
        type: String,
        required: true,
        minlength: [3, "last-name should have at least 3 characters"],
      },
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      match: [/.+\@.+\..+/, "Please enter a valid email"],
      trim: true,
      lowercase: true,
      index: true, 
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
      minlength: [6, "Password must be at least 6 characters"],
      match: [
        // very strict
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%#*?&]).{6,}$/,
        "Password must include uppercase, lowercase, number and special character",
      ],
    },
    role: {
      type: String,
      enum: ["user", "captain"],
      default: "captain",
    },
    verified: {
      type: Boolean,
      default: false,
    },
    socketId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    vehicle: {
      color: {
        type: String,
        required: true,
      },
      plate: {
        type: String,
        required: true,
        minlength: [3, "Plate should have at least 3 characters long"],
        uppercase: true,
        trim: true,
      },
      capacity: {
        type: Number,
        required: true,
        min: [1, "capacity must be at least 1"],
      },
      vehicleType: {
        type: String,
        enum: ["car", "motorcycle", "auto"],
        required: true,
      },
    },

    // GeoJSON Point — required for $geoWithin / $centerSphere queries.
    // Field order MUST be [longitude, latitude] per GeoJSON spec.
    // The 2dsphere index is what makes the geo query actually work.
    location: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [lng, lat]
        default: [0, 0],
      },
    },
  },
  { timestamps: true },
);

// 2dsphere index enables MongoDB $geoWithin and $nearSphere queries on the location field.
// Without this index the getCaptainsInTheRadius query silently returns [] every time.
captainSchema.index({ location: "2dsphere" });

captainSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
  return;
});

captainSchema.methods.comparePassword = async function (user_password) {
  return await bcrypt.compare(user_password, this.password);
};

captainSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.password;
    delete ret.__v;
    return ret;
  },
});

const captainModel = mongoose.model("Captain", captainSchema);

module.exports = captainModel;
