const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const sessionSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    refreshToken: {
      type: String,
      default: null,
    },
    ip: {
      type: String,
      required: true,
    },
    userAgent: {
      type: String,
      required: true,
    },
    revoked: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

sessionSchema.pre("save", async function () {
  if (!this.isModified("refreshToken") || !this.refreshToken) {
    return;
  }

  if (this.refreshToken.startsWith("$2b$")) {
    return;
  }
  this.refreshToken = await bcrypt.hash(this.refreshToken, 10);
});

sessionSchema.methods.compareRefreshToken = async function (prev_refreshToken) {
  return await bcrypt.compare(prev_refreshToken, this.refreshToken);
};

sessionSchema.set("toJSON", {
  transform: function (doc, ret) {
    delete ret.refreshToken;
    delete ret.__v;
    return ret;
  },
});

const sessionModel = mongoose.model("Session", sessionSchema);

module.exports = sessionModel;
