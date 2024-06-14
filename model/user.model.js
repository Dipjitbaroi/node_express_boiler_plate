import mongoose from "mongoose";

const Schema = mongoose.Schema;

const AddressSchema = new Schema({
  address: { type: String, default: "--" },
  city: { type: String, default: "--" },
  country: { type: String, default: "--" },
  countryState: { type: String, default: "--" },
  postcode: { type: String, default: "--" },
  timeZone: {
    type: String,
    default: "IST",
    enum: ["EST", "MT", "IST", "CST", "PT"],
  },
});

const SettingsSchema = new Schema({
  currency: { type: String, default: "USD" },
  oddsFormat: {
    type: String,
    default: "percentage",
    enum: ["percentage", "decimal", "fractional", "american"],
  },
});

const gameTypes = [
  "cricket",
  "soccer",
  "tennis",
  "casino",
  "horse_racing",
  "greyhound_racing",
];

const listingTypes = [
  "exchange",
  "bookmaker",
  "fancy",
  "premium",
  "toss",
  "tie",
];

const initializeWhiteLevelSettings = () => {
  const whiteLevelSettings = [];

  gameTypes.forEach((gameType) => {
    listingTypes.forEach((listingType) => {
      whiteLevelSettings.push({
        gameType,
        listingType,
        minAmount: 0,
        maxAmount: 0,
        maxProfit: 0,
        oddsLimit: 0,
        betDelay: 5,
      });
    });
  });

  return whiteLevelSettings;
};

const SettingLimitsSchema = new Schema({
  gameType: {
    type: String,
    enum: gameTypes,
  },
  listingType: {
    type: String,
    enum: ["exchange", "bookmaker", "fancy", "premium", "toss", "tie"],
  },
  minAmount: {
    type: Number,
    default: 0,
  },
  maxAmount: {
    type: Number,
    default: 0,
  },
  maxProfit: {
    type: Number,
    default: 0,
  },
  oddsLimit: {
    type: Number,
    default: 0,
  },
  oddsLowerLimit: {
    type: Number,
    default: 0,
  },
  betDelay: {
    type: Number,
    default: 5,
  },
});

const ContactDetailsSchema = new Schema({
  primaryNumber: { type: String, required: false },
  email: { type: String, required: false },
});

export const UserSchema = new Schema(
  {
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      unique: false,
    },
    userId: { type: mongoose.Schema.Types.ObjectId },
    boss_level: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    white_level: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    subadmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    super_master: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    master: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true, minlength: 8 },
    domain: { type: String },
    adminDomain: { type: String },
    country: { type: String, default: "India" },
    language: { type: String, default: "English" },
    accountType: {
      type: String,
      default: "user",
      required: true,
      enum: [
        "user",
        "master",
        "super_master",
        "admin",
        "subadmin",
        "white_level",
        "boss_level",
        "jse_level",
      ],
    },
    status: {
      type: String,
      enum: ["Active", "Suspended", "Locked", "Deleted"],
      default: "Active",
    },
    upline_locked: { type: Boolean, default: false },
    balance: { type: Number, default: 0 },
    available_balance: { type: Number, default: 0 },
    deposit_by_upline: { type: Number, default: 0 },
    balance_downline: { type: Number, default: 0 },
    credit_ref: { type: Number, required: false, default: 0 },
    exposer: { type: Number, required: false, default: 0 },
    exposer_limit: { type: Number, default: 0, required: false },
    ref_PL: { type: Number, required: false, default: 0 },
    partnership: { type: Number, required: false, default: 0 },
    role: {
      type: String,
      enum: ["Owner", "Partner", "Admin", "User"],
      default: "User",
    },
    address: [AddressSchema],
    settings: [SettingsSchema],
    contact_details: [ContactDetailsSchema],
    commission: { type: Number, default: 0 },
    failed_login_count: { type: Number, default: 0 },
    settingLimits: {
      type: [SettingLimitsSchema],
    },
    tvUrl: { type: String, default: "" },
    scoreUrl: { type: String, default: "" },
    siteDown: { type: Boolean, default: false },
    default_stake: { type: Number, default: 0 },
    stakes: { type: Object },
    beforeInplay: { type: Number, default: 0 },
    deviceId: { type: String, default: "" },
  },
  { timestamps: true }
);

// Pre-save hook to insert settingLimits for white_level and set role
UserSchema.pre("save", async function (next) {
  try {
    if (this.accountType === "white_level" && this.isModified("accountType")) {
      this.settingLimits = initializeWhiteLevelSettings();
      // this.role = "Partner";
    }
    next();
  } catch (error) {
    console.error("Error during pre-save hook:", error);
    next(error); // Pass the error to the next middleware
  }
});

const User = mongoose.model("User", UserSchema);

export default User;
