const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const otpSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    otp: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
    },
  },
  { timestamps: true },
);

otpSchema.pre("save", async function () {
  if (!this.isModified("otp")) return;

  this.otp = await bcrypt.hash(this.otp, 10);
  return;
});

otpSchema.methods.compareOtp = async function (userOtp) {
  return await bcrypt.compare(userOtp, this.otp);
};

const otpModel = mongoose.model("Otp", otpSchema);

module.exports = otpModel;
