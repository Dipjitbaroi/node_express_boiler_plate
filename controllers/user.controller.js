import User from "../model/user.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import ActivityLog from "../model/activitylog.model.js";
import Message from "../model/usermessage.model.js";
import Bet from "../model/bet.model.js";
import { query } from "express";
import mongoose from "mongoose";
import { BlockMarket } from "../model/market.model.js";

// Function to add a new user
// export const addUser = async (req, res) => {
//   const { username, accountType, password,parent_id } = req.body;

// console.log("user", username, accountType, password,parent_id)
//   try {
//     // Check if the username already exists
//     const existingUser = await User.findOne({ username });
//     console.log(existingUser)
//     if (existingUser) {
//       return res.status(400).json({ message: 'Username already exists' });
//     }
//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 10); // 10 is the saltRounds
//     // Create a new user with the hashed password
//     const newUser = new User({
//       username,
//       accountType,
//       parent_id,
//       password: hashedPassword,
//     });
//     console.log("first", newUser)

//     // Save the user to the database
//     await newUser.save();

//     return res.status(201).json({ message: 'User created successfully' });
//   } catch (error) {
//     console.error('Error saving user:', error);
//     return res.status(500).json({ message: 'Something went wrong' });
//   }
// };
export const createSuperUser = async (req, res) => {
  try {
    const username = "WL01";
    const password = "12345678";

    // Check if a superuser with the same username already exists
    const existingSuperUser = await User.findOne({ username });
    if (existingSuperUser) {
      res.status(400).json("already existed");
      return;
    }
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the saltRounds
    // Create a new superuser
    const superuser = new User({
      parent_id: "659d42863cb3028c5d6f8d0c",
      username,
      password: hashedPassword,
      accountType: "white_level",
    });

    await superuser.save();
    res.status(200).json({ message: "Superuser created", data: superuser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Faild to add superuser", error: error.message });
  }
};

export const addUser = async (req, res) => {
  const {
    username,
    accountType,
    role,
    password,
    parent_id,
    commission,
    exposer_limit,
    domain,
    adminDomain,
  } = req.body;

  try {
    // if (accountType === "white_level" && req.user.accountType !== "jse_level") {
    //   return res.status(400).json({
    //     message: `You have no permission to create ${accountType}`,
    //   });
    // }

    // Check if the username already exists
    const existingUserWithSameUsername = await User.findOne({ username });

    if (existingUserWithSameUsername) {
      return res.status(400).json({
        message: "Username already exists. Please choose a different username.",
      });
    }

    // Find the parent user
    const parentUser = await User.findById(parent_id);

    if (!parentUser) {
      return res.status(400).json({
        message: "Parent user not found. Please provide a valid parent user.",
      });
    }

    // Define the hierarchy of account types
    const hierarchy = {
      jse_level: [
        "boss_level",
        "white_level",
        "subadmin",
        "admin",
        "super_master",
        "master",
        "user",
      ],
      boss_level: [
        "white_level",
        "subadmin",
        "admin",
        "super_master",
        "master",
        "user",
      ],
      white_level: ["subadmin", "admin", "super_master", "master", "user"],
      subadmin: ["admin", "super_master", "master", "user"],
      admin: ["super_master", "master", "user"],
      super_master: ["master", "user"],
      master: ["user"],
    };

    // Check if the parent's account type allows creating the specified account type
    if (!hierarchy[parentUser.accountType]) {
      return res.status(400).json({
        message: `Cannot create ${accountType} account under ${parentUser.accountType} account.`,
      });
    }

    if (!hierarchy[parentUser.accountType].includes(accountType)) {
      return res.status(400).json({
        message: `Cannot create ${accountType} account under ${parentUser.accountType} account.`,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10); // 10 is the saltRounds

    // Create a new user with the hashed password
    const newUser = new User({
      username,
      accountType,
      role,
      parent_id,
      commission,
      exposer_limit,
      boss_level: parentUser.boss_level || null,
      white_level: parentUser.white_level || null,
      subadmin: parentUser.subadmin || null,
      admin: parentUser.admin || null,
      super_master: parentUser.super_master || null,
      master: parentUser.master || null,
      password: hashedPassword,
      domain,
      adminDomain,
    });

    const field = parentUser.accountType;
    newUser[field] = parentUser._id;

    // Save the user to the database
    await newUser.save();

    return res.status(201).json({ message: "User created successfully." });
  } catch (error) {
    console.error("Error saving user:", error);
    return res
      .status(500)
      .json({ message: "Something went wrong. Please try again later." });
  }
};
const handleFailedLoginCount = async (user) => {
  let update = { $inc: { failed_login_count: 1 } };
  if (user.failed_login_count >= 2) {
    update = { $set: { status: "Locked", failed_login_count: 0 } };
  }
  await User.updateOne({ _id: user._id }, update);
};

const handleFailedLogin = async (user, body) => {
  await new ActivityLog({
    user_id: user._id,
    boss_level: user.boss_level || null,
    white_level: user.white_level || null,
    subadmin: user.subadmin || null,
    admin: user.admin || null,
    super_master: user.super_master || null,
    master: user.master || null,
    login_status: "Login Failed",
    req_site: body.req_site,
    ip_address: body.ip_address,
    isp: body.isp,
    city_state_country: body.city_state_country,
  }).save();
};
export const loginUser = async (req, res) => {
  const {
    username,
    password,
    req_site,
    req_domain,
    ip_address,
    isp,
    city_state_country,
  } = req.body;

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    if (user.accountType !== "jse_level" || user.accountType !== "boss_level") {
      if (user.accountType !== "white_level") {
        const wl = await User.findById(user.white_level);
        if (user.role === "User") {
          if (wl.domain !== req_domain) {
            return res.status(403).json({ message: "Account not authorized" });
          }
        }
        if (user.role === "Admin") {
          if (wl.adminDomain !== req_domain) {
            return res.status(403).json({ message: "Account not authorized" });
          }
        }
      } else {
        if (user.adminDomain !== req_domain) {
          return res.status(403).json({ message: "Account not authorized" });
        }
      }
    }
    const passwordMatch = await bcrypt.compare(password, user.password);

    if (["Suspended", "Locked", "Deleted"].includes(user.status)) {
      await handleFailedLogin(user, req.body);
      return res
        .status(403)
        .json({ message: `Your account is ${user.status.toLowerCase()}` });
    }

    if (!passwordMatch) {
      await handleFailedLoginCount(user);
      await handleFailedLogin(user, req.body);
      return res.status(401).json({ message: "Authentication failed" });
    }
    if (user.upline_locked === true) {
      // await handleFailedLoginCount(user);
      await handleFailedLogin(user, req.body);
      return res
        .status(403)
        .json({ message: "Account suspended/Not authorized" });
    }

    if (
      (user.role === "User" && req_site !== "User") ||
      (user.role === "Admin" && req_site !== "Admin") ||
      (user.role === "Partner" && req_site !== "Admin") ||
      (user.role === "Owner" && req_site !== "Owner")
    ) {
      await handleFailedLoginCount(user);
      await handleFailedLogin(user, req.body);
      return res.status(401).json({ message: "Authentication failed" });
    }

    await new ActivityLog({
      user_id: user._id,
      boss_level: user.boss_level || null,
      white_level: user.white_level || null,
      subadmin: user.subadmin || null,
      admin: user.admin || null,
      super_master: user.super_master || null,
      master: user.master || null,
      login_status: "Login Success",
      req_site,
      ip_address,
      isp,
      city_state_country,
    }).save();

    const deviceId = Math.floor(
      100000000 + Math.random() * 1200000000
    ).toString();
    const token = jwt.sign(
      {
        userId: user._id,
        username: user.username,
        accountType: user.accountType,
        deviceId: deviceId,
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "1h" }
    );

    await User.updateOne(
      { _id: user._id },
      {
        $set: {
          failed_login_count: 0,
          deviceId: deviceId,
        },
      }
    );

    return res.status(200).json({
      token,
      user_id: user._id,
      message: "Authentication successful",
    });
  } catch (error) {
    console.error("Error during login:", error);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Function to authenticate a user and generate a JWT token
// export const loginUser = async (req, res) => {
//   const { username, password, ip_address, isp, city_state_country } = req.body;
//   let userId;
//   try {
//     // Find the user by username in the database
//     const user = await User.findOne({ username });
//     userId = user._id
//     // If the user doesn't exist, return an error
//     if (!user) {
//       const activity_log_failed = new ActivityLog({
//         userId: user._id,
//         login_status: "Login Failed",
//         ip_address: ip_address,
//         isp: isp,
//         city_state_country: city_state_country,
//       });
//       activity_log_failed.save();
//       return res.status(401).json({ message: "Authentication failed" });
//     }

//     // Compare the provided password with the hashed password in the database
//     const passwordMatch = await bcrypt.compare(password, user.password);

//     if (!passwordMatch) {
//       const activity_log_failed = new ActivityLog({
//         userId: user._id,
//         login_status: "Login Failed",
//         ip_address: ip_address,
//         isp: isp,
//         city_state_country: city_state_country,
//       });
//       activity_log_failed.save();
//       return res.status(401).json({ message: "Authentication failed" });
//     }

//     // If the password is correct, generate a JWT token
//     const token = jwt.sign(
//       { userId: user._id, username: user.username },
//       "sdlkjfdasnfmouficksdmnciavasdlkacnlk", // Replace with your secret key
//       { expiresIn: "1h" } // Token expiration time
//       );
//       const activity_log_success = new ActivityLog({
//         userId: user._id,
//         login_status: "Login Success",
//         ip_address: ip_address,
//         isp: isp,
//         city_state_country: city_state_country,
//       });
//       activity_log_success.save();
//       // Return the token to the client
//       return res
//       .status(200)
//       .json({ token, userId: user._id, message: "Authentication successful" });
//   } catch (error) {
//     const activity_log_failed = new ActivityLog({
//       userId: userId,
//       login_status: "Login Failed",
//       ip_address: ip_address,
//       isp: isp,
//       city_state_country: city_state_country,
//     });
//     activity_log_failed.save();
//     return res.status(500).json({ message: "Something went wrong" });
//   }
// };

// export const loginUser = async (req, res) => {
//   const { username, password, req_site, ip_address, isp, city_state_country } =
//     req.body;

//   let db_user; // Initialize userId variable

//   const handleFailedLoginCount = async () => {
//     if (db_user.failed_login_count >= 2) {
//       db_user.status = "Locked";
//       db_user.failed_login_count = 0;
//     } else {
//       db_user.failed_login_count += 1;
//     }
//     await db_user.save();
//   };
//   const handleFailedLogin = async () => {
//     const activity_log_failed = new ActivityLog({
//       user_id: db_user._id || null, // Use userId if available, or null if not
//       login_status: "Login Failed",
//       req_site,
//       ip_address,
//       isp,
//       city_state_country,
//     });
//     await activity_log_failed.save();
//   };

//   try {
//     // Find the user by username in the database
//     const user = await User.findOne({ username });

//     if (!user) {
//       return res.status(401).json({ message: "Authentication failed" });
//     }

//     // Now that you've checked if user exists, you can access its properties
//     db_user = user; // Set userId to the found user's ID

//     // Continue with the rest of your authentication logic
//     const passwordMatch = await bcrypt.compare(password, user.password);

//     if (user.status === "Suspended") {
//       await handleFailedLogin();
//       return res.status(403).json({ message: "Your account is suspended" });
//     }

//     if (user.status === "Locked") {
//       await handleFailedLogin();
//       return res.status(403).json({ message: "Your account is locked" });
//     }
//     if (user.status === "Deleted") {
//       await handleFailedLogin();
//       return res.status(404).json({ message: "User not found" });
//     }
//     if (
//       !passwordMatch ||
//       (user.role === "User" && req_site !== "User") ||
//       (user.role === "Admin" && req_site !== "Admin") ||
//       (user.role === "Partner" && req_site !== "Admin") ||
//       (user.role === "Owner" && req_site !== "Owner")
//     ) {
//       await handleFailedLoginCount();
//       await handleFailedLogin();
//       return res.status(401).json({ message: "Authentication failed" });
//     }

//     // If the password is correct, generate a JWT token
//     const token = jwt.sign(
//       {
//         userId: user._id,
//         username: user.username,
//         accountType: user.accountType,
//       },
//       process.env.TOKEN_SECRET,
//       { expiresIn: "1h" }
//     );
//     const activity_log_success = new ActivityLog({
//       user_id: user._id,
//       login_status: "Login Success",
//       req_site,
//       ip_address,
//       isp,
//       city_state_country,
//     });
//     await activity_log_success.save();

//     db_user.failed_login_count = 0;
//     await db_user.save();
//     // Return the token to the client
//     return res.status(200).json({
//       token,
//       user_id: user._id,
//       message: "Authentication successful",
//     });
//   } catch (error) {
//     await handleFailedLogin();
//     return res.status(500).json({ message: "Something went wrong" });
//   }
// };

// Function to get user information based on a token
export const getUser = async (req, res) => {
  const token = req.headers.authorization; // Get the token from the request headers

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Token not provided" });
  }

  try {
    // Verify the token
    const plain_token = token.split(" ")[1];
    const decodedToken = jwt.verify(
      plain_token,
      "sdlkjfdasnfmouficksdmnciavasdlkacnlk"
    );

    // Check if the decoded token contains a userId
    if (!decodedToken.userId) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }

    // Fetch the user based on the decoded token data (e.g., user ID)
    const user = await User.findById(decodedToken.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Omit sensitive information from the user object (e.g., password)
    const userWithoutPassword = { ...user._doc };
    delete userWithoutPassword.password;

    const getDownline = (accounttype) => {
      switch (accounttype) {
        case "white_level":
          return [
            {
              name: "Sub Admin",
              path: "downline/sub_admin",
              accountType: "subadmin",
            },
            { name: "Admin", path: "downline/admin", accountType: "admin" },
            {
              name: "Super Master",
              path: "downline/super_master",
              accountType: "super_master",
            },
            { name: "Master", path: "downline/master", accountType: "master" },
            { name: "User", path: "downline/user", accountType: "user" },
          ];
        case "subadmin":
          return [
            { name: "Admin", path: "downline/admin", accountType: "admin" },
            {
              name: "Super Master",
              path: "downline/super_master",
              accountType: "super_master",
            },
            { name: "Master", path: "downline/master", accountType: "master" },
            { name: "User", path: "downline/user", accountType: "user" },
          ];
        case "admin":
          return [
            {
              name: "Super Master",
              path: "downline/super_master",
              accountType: "super_master",
            },
            { name: "Master", path: "downline/master", accountType: "master" },
            { name: "User", path: "downline/user", accountType: "user" },
          ];
        case "super_master":
          return [
            { name: "Master", path: "downline/master", accountType: "master" },
            { name: "User", path: "downline/user", accountType: "user" },
          ];
        case "master":
          return [{ name: "User", path: "downline/user", accountType: "user" }];
        case "user":
          return [];
        default:
          break;
      }
    };
    // Return the user's information
    return res.status(200).json({
      success: true,
      message: "User data was successfully retrieved",
      data: {
        ...userWithoutPassword,
        available_downline: getDownline(userWithoutPassword.accountType),
      },
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized: Invalid token" });
    }
    return res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
};

export const searchUser = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { username } = req.query;
    // Check if the user making the request has the required account type
    if (req.user.accountType !== "white_level") {
      return res
        .status(403)
        .json({ error: "Access denied. Insufficient privileges." });
    }

    const users = await User.find({
      white_level: userId,
      username,
      accountType: "user",
    }).populate({
      path: "master super_master admin subadmin boss_level white_level",
      select: "username",
    });

    // If no users are found, return a 400 Bad Request response
    if (!users || users.length === 0) {
      return res.status(400).json({
        message: "Bad request. Incorrect username or user not found.",
      });
    }

    res.status(200).json(users);
  } catch (error) {
    console.error("Error searching user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Function to get all user profiles
// export const getAllUsers = async (req, res) => {
//   try {
//     // Fetch all users from the database
//     const users = await User.find({}, '-password'); // Exclude the password field from the results

//     return res.status(200).json({success:true,message:'Here are the user list',data:users});
//   } catch (error) {
//     return res.status(500).json({success:false, message: 'Something went wrong' });
//   }
// };

export const getTopPlayers = async (req, res) => {
  const white_level = req.user.userId;
  try {
    const result = await Bet.aggregate([
      {
        $match: {
          white_level: new mongoose.Types.ObjectId(white_level),
          status: "active",
          stake: { $gt: 0 },
        },
      },
      {
        $lookup: {
          from: "users", // Use the actual collection name of the User model
          localField: "userId",
          foreignField: "_id",
          as: "userDetails",
        },
      },
      {
        $unwind: "$userDetails",
      },
      {
        $group: {
          _id: "$userId",
          username: { $first: "$userDetails.username" },
          matched_amnt: { $sum: "$stake" },
          exposer: { $first: "$userDetails.exposer" },
        },
      },
    ]);
    return res.status(200).json({
      success: true,
      message: "Here are the players list",
      data: result,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Fetch all users from the database
    const users = await User.find({}, "-password")
      .lean() // Convert the Mongoose documents to plain JavaScript objects
      .exec();

    // Loop through the users and apply field exclusions based on accountType
    users.forEach((user) => {
      if (user.accountType === "user") {
        delete user.partnership;
        // } else if (['master', 'super-master', 'admin', 'subadmin'].includes(user.accountType)) {
        //   delete user.exposer;
      } else {
        delete user.exposer_limit;
      }
    });

    return res
      .status(200)
      .json({ success: true, message: "Here are the user list", data: users });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

// export const getUsersByParentId = async (req, res) => {
//   const { parent_id, page = 1, limit = 10, accountType } = req.query;

//   try {
//     // Convert page and limit to integers
//     const pageNumber = parseInt(page, 10);
//     const limitNumber = parseInt(limit, 10);

//     // Calculate the number of documents to skip based on the page number and limit
//     const skip = (pageNumber - 1) * limitNumber;

//     // Build the query object with the specified parent_id
//     const query = { parent_id: parent_id };

//     // If accountType is provided, add it to the query
//     if (accountType) {
//       query.accountType = accountType;
//     }

//     // Fetch users from the database with pagination and optional accountType filtering
//     const users = await User.find(query, "-password")
//       .skip(skip)
//       .limit(limitNumber)
//       .lean() // Convert the Mongoose documents to plain JavaScript objects
//       .exec();

//     users.forEach((user) => {
//       if (user.accountType === "user") {
//         delete user.partnership;
//         // } else if (['master', 'super-master', 'admin', 'subadmin'].includes(user.accountType)) {
//         //   delete user.exposer;
//       } else {
//         delete user.exposer_limit;
//       }
//     });

//     if (users.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No users found with the specified criteria",
//       });
//     }

//     // Count the total number of documents that match the query
//     const totalCount = await User.countDocuments(query);

//     // Calculate the total number of pages based on the total count and limit
//     const totalPages = Math.ceil(totalCount / limitNumber);

//     return res.status(200).json({
//       success: true,
//       message: "Users retrieved successfully",
//       data: users,
//       pagination: {
//         page: pageNumber,
//         total: totalCount,
//         totalPages: totalPages,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong",
//       error: error.message,
//     });
//   }
// };

// export const getUsersByParentId = async (req, res) => {
//   const { parent_id, page = 1, limit = 10, accountType, search } = req.query;

//   try {
//     // Convert page and limit to integers
//     const pageNumber = parseInt(page, 10);
//     const limitNumber = parseInt(limit, 10);

//     // Calculate the number of documents to skip based on the page number and limit
//     const skip = (pageNumber - 1) * limitNumber;

//     // Build the query object with the specified parent_id
//     const query = { parent_id: parent_id };

//     // If accountType is provided, add it to the query
//     if (accountType) {
//       query.accountType = accountType;
//     }

//     // If search is provided, add a search condition to the query
//     if (search) {
//       // Use a regular expression to perform a case-insensitive search on the username field
//       query.username = { $regex: new RegExp(search, 'i') };
//     }

//     // Fetch users from the database with pagination, sorting, and optional accountType filtering
//     const users = await User.find(query, "-password")
//     .skip(skip)
//     .limit(limitNumber)
//     .collation({ locale: 'en', strength: 2 }) // Case-insensitive sorting
//     .sort({ username: 1 }) // Sort by username in ascending order
//     .lean()
//     .exec();
//     console.log(users);
//     users.forEach((user) => {
//       if (user.accountType === "user") {
//         delete user.partnership;
//       } else {
//         delete user.exposer_limit;
//       }
//     });

//     if (users.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No users found with the specified criteria",
//       });
//     }

//     console.log(users);
//     // Count the total number of documents that match the query
//     const totalCount = await User.countDocuments(query);

//     // Calculate the total number of pages based on the total count and limit
//     const totalPages = Math.ceil(totalCount / limitNumber);

//     return res.status(200).json({
//       success: true,
//       message: "Users retrieved successfully",
//       data: users,
//       pagination: {
//         page: pageNumber,
//         total: totalCount,
//         totalPages: totalPages,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong",
//       error: error.message,
//     });
//   }
// };

// export const getUsersByParentId = async (req, res) => {
//   const {
//     parent_id,
//     page = 1,
//     limit = 10,
//     accountType,
//     search,
//     status,
//   } = req.query;

//   try {
//     // Convert page and limit to integers
//     const pageNumber = parseInt(page, 10);
//     const limitNumber = parseInt(limit, 10);

//     // Calculate the number of documents to skip based on the page number and limit
//     const skip = (pageNumber - 1) * limitNumber;

//     // Build the query object with the specified parent_id
//     const query = { parent_id: parent_id };

//     // If accountType is provided, add it to the query
//     if (accountType) {
//       query.accountType = accountType;
//     }

//     // If search is provided, add a search condition to the query
//     if (search) {
//       // Use a regular expression to perform a case-insensitive search on the username field
//       query.username = { $regex: new RegExp(search, "i") };
//     }

//     // If status is provided, add it to the query
//     if (status) {
//       query.status = status;
//     }

//     // Fetch users from the database with pagination, sorting, and optional accountType filtering
//     const users = await User.find(query, "-password")
//       .skip(skip)
//       .limit(limitNumber)
//       .collation({ locale: "en", strength: 2 }) // Case-insensitive sorting
//       .sort({ username: 1 }) // Sort by username in ascending order
//       .lean()
//       .exec();
//     console.log(users);
//     users.forEach((user) => {
//       if (user.accountType === "user") {
//         delete user.partnership;
//       } else {
//         delete user.exposer_limit;
//       }
//     });

//     if (users.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: "No users found with the specified criteria",
//       });
//     }

//     console.log(users);
//     // Count the total number of documents that match the query
//     const totalCount = await User.countDocuments(query);

//     // Calculate the total number of pages based on the total count and limit
//     const totalPages = Math.ceil(totalCount / limitNumber);

//     return res.status(200).json({
//       success: true,
//       message: "Users retrieved successfully",
//       data: users,
//       pagination: {
//         page: pageNumber,
//         total: totalCount,
//         totalPages: totalPages,
//       },
//     });
//   } catch (error) {
//     return res.status(500).json({
//       success: false,
//       message: "Something went wrong",
//       error: error.message,
//     });
//   }
// };
export const getDownlineUsers = async (req, res) => {
  try {
    const parentId = req.params.user_id; // Assuming parentId is passed in the URL params
    const { accountType, status } = req.query;

    const parent = await User.findById(parentId);
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    const query = { [parent.accountType]: parentId }; // Use [parent.accountType] to dynamically set the key

    if (accountType) {
      query.accountType = accountType;
    }
    if (status) {
      query.status = status;
    }

    const users = await User.find(query);

    res.status(200).json({
      success: true,
      message: "Successfully fetched data",
      data: users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const getDownlineUserList = async (req, res) => {
  try {
    const parentId = req.user.userId; // Assuming parentId is passed in the URL params
    const pageNumber = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const { accountType, status } = req.query;

    const parent = await User.findById(parentId);
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }

    const query = { [parent.accountType]: parentId }; // Use [parent.accountType] to dynamically set the key

    if (accountType) {
      query.accountType = accountType;
    }

    if (status) {
      query.status = status;
    }

    const totalUsers = await User.countDocuments(query);
    const totalPages = Math.ceil(totalUsers / limit);
    console.log({ query });

    const users = await User.find(query)
      .skip((pageNumber - 1) * limit)
      .limit(limit)
      .populate([
        { path: "master", select: "username" },
        { path: "super_master", select: "username" },
        { path: "admin", select: "username" },
        { path: "subadmin", select: "username" },
        { path: "white_level", select: "username" },
        { path: "boss_level", select: "username" },
      ]);

    res.status(200).json({
      success: true,
      message: "Successfully fetched data",
      data: users,
      pagination: {
        page: pageNumber,
        total: totalUsers,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getUsersByParentId = async (req, res) => {
  const {
    parent_id,
    page = 1,
    limit = 10,
    queryFor,
    accountType,
    search,
    status,
  } = req.query;
  try {
    // Convert page and limit to integers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Calculate the number of documents to skip based on the page number and limit
    const skip = (pageNumber - 1) * limitNumber;

    // Build the query object with the specified parent_id
    const query = { parent_id: parent_id };

    // If accountType is provided, add it to the query
    if (accountType) {
      query.accountType = accountType;
    }

    // If search is provided, add a search condition to the query
    if (search) {
      // Use a regular expression to perform a case-insensitive search on the username field
      query.username = { $regex: new RegExp(search, "i") };
    }
    if (status === "All") {
      // Fetch users from the database with pagination, sorting, and optional accountType filtering
      const users = await User.find(query, "-password")
        .skip(skip)
        .limit(limitNumber)
        .collation({ locale: "en", strength: 2 }) // Case-insensitive sorting
        .sort({ username: 1 }) // Sort by username in ascending order
        .lean()
        .exec();

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          message: "No users found with the specified criteria",
        });
      }

      // Calculate the sums for top_balances
      let totalBalance = 0;
      let totalExposure = 0;
      let totalAvailableBalance = 0;

      users.forEach((user) => {
        totalBalance += user.balance || 0;
        totalExposure += user.exposer || 0;
        totalAvailableBalance += user.available_balance || 0;
      });
      const filteredUsers = users.filter((user) => {
        if (queryFor === "white_level") {
          if (user.accountType === "user") {
            // Delete the 'partnership' property for 'user' accountType
            delete user.partnership;
          } else {
            // Delete the 'exposer_limit' property for other accountTypes
            delete user.exposer_limit;
          }
          return true; // Keep the user in the filtered array
        } else {
          if (user.status === "Deleted") {
            return false;
          }
          if (user.accountType === "user") {
            // Delete the 'partnership' property for 'user' accountType
            delete user.partnership;
          } else {
            // Delete the 'exposer_limit' property for other accountTypes
            delete user.exposer_limit;
          }
          return true;
        }
      });
      // Define the custom sorting function based on the accountType hierarchy
      const accountTypeOrder = {
        subadmin: 1,
        admin: 2,
        super_master: 3,
        master: 4,
        user: 5,
      };

      filteredUsers.sort((a, b) => {
        return (
          accountTypeOrder[a.accountType] - accountTypeOrder[b.accountType]
        );
      });
      // Fetch parent data from the database
      const parent = await User.findById(parent_id);

      const total_available_balance =
        totalAvailableBalance + parent.available_balance;

      const upline_pl = total_available_balance - parent.credit_ref;

      // Count the total number of documents that match the query
      // const totalCount = await User.countDocuments(query);
      // Calculate the total number of documents that match the query
      const totalCount = await User.countDocuments(query);

      // Calculate the total number of pages based on the total count and limit
      const totalPages = Math.ceil(totalCount / limitNumber);

      return res.status(200).json({
        success: true,
        message: "All Users retrieved successfully",
        top_balances: {
          total_balance: totalBalance,
          total_exposure: totalExposure,
          available_balance: totalAvailableBalance,
          balance: parent.available_balance,
          total_available_balance: total_available_balance,
          upline_pl: upline_pl,
        },
        data: filteredUsers,
        pagination: {
          page: pageNumber,
          total: totalCount,
          totalPages: totalPages,
        },
      });
    }
    // If status is provided, add it to the query
    if (
      status === "Active" ||
      status === "Suspended" ||
      status === "Locked" ||
      status === "Deleted"
    ) {
      query.status = status;
    }

    // Fetch users from the database with pagination, sorting, and optional accountType filtering
    const users = await User.find(query, "-password")
      .skip(skip)
      .limit(limitNumber)
      .collation({ locale: "en", strength: 2 }) // Case-insensitive sorting
      .sort({ username: 1 }) // Sort by username in ascending order
      .lean()
      .exec();

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No users found with the specified criteria",
      });
    }

    console.log(users);
    // Calculate the sums for top_balances
    let totalBalance = 0;
    let totalExposure = 0;
    let totalAvailableBalance = 0;

    users.forEach((user) => {
      // totalBalance += user.balance || 0;
      // totalExposure += user.exposer || 0;
      // totalAvailableBalance += user.available_balance || 0;

      if (user.accountType === "user") {
        delete user.partnership;
      } else {
        delete user.exposer_limit;
      }
    });
    const parent = await User.findById(parent_id);
    const allUser = await User.find({ parent_id: parent_id });
    allUser.forEach((user) => {
      totalBalance += user.balance || 0;
      totalExposure += user.exposer || 0;
      totalAvailableBalance += user.available_balance || 0;
    });
    const total_available_balance =
      totalAvailableBalance + parent.available_balance;
    const upline_pl = total_available_balance - parent.credit_ref;
    // Count the total number of documents that match the query
    const totalCount = await User.countDocuments(query);

    // Calculate the total number of pages based on the total count and limit
    const totalPages = Math.ceil(totalCount / limitNumber);

    return res.status(200).json({
      success: true,
      message: "Users retrieved successfully",
      top_balances: {
        total_balance: totalBalance,
        total_exposure: totalExposure,
        available_balance: totalAvailableBalance,
        balance: parent.available_balance,
        total_available_balance: total_available_balance,
        upline_pl: upline_pl,
      },
      data: users,
      pagination: {
        page: pageNumber,
        total: totalCount,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// Function to update user password
export const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const token = req.headers.authorization;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Token not provided" });
  }

  try {
    // Verify the token
    const plain_token = token.split(" ")[1];

    const decodedToken = jwt.verify(
      plain_token,
      "sdlkjfdasnfmouficksdmnciavasdlkacnlk"
    ); // Replace with your secret key

    // Fetch the user based on the decoded token data (e.g., user ID)
    const user = await User.findById(decodedToken.userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Compare the provided currentPassword with the user's hashed password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Incorrect current password" });
    }

    // Hash the new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    user.password = hashedNewPassword;

    // Save the updated user to the database
    await user.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Function to update user status
// export const updateUserStatus = async (req, res) => {
//   const token = req.headers.authorization; // Get the token from the request headers
//   const { status } = req.body; // Get the new status from the request body

//   if (!token) {
//     return res.status(401).json({ message: 'Unauthorized: Token not provided' });
//   }

//   try {
//     // Verify the token
//     const plain_token = token.split(" ")[1];
//     const decodedToken = jwt.verify(plain_token, "sdlkjfdasnfmouficksdmnciavasdlkacnlk");

//     // Fetch the user based on the decoded token data (e.g., user ID)
//     const user = await User.findById(decodedToken.userId);

//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Update the user's status
//     user.status = status;

//     // Save the updated user to the database
//     await user.save();

//     // Return the updated user's information
//     return res.status(200).json({ message: 'User status updated successfully', user });
//   } catch (error) {
//     if (error instanceof jwt.JsonWebTokenError) {
//       return res.status(401).json({ message: 'Unauthorized: Invalid token' });
//     }
//     return res.status(500).json({ message: 'Something went wrong' });
//   }
// };

export const updateUserField = async (req, res) => {
  const token = req.headers.authorization; // Get the token from the request headers
  const { field, value, user_id, password } = req.body; // Get the field name, new value, and user_id from the request body

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Token not provided" });
  }

  try {
    // Verify the token and extract parent_id
    const plain_token = token.split(" ")[1];
    const decodedToken = jwt.verify(
      plain_token,
      "sdlkjfdasnfmouficksdmnciavasdlkacnlk"
    );
    const parent_id = decodedToken.userId;
    // Fetch the user based on user_id and parent_id
    const user = await User.findOne({ _id: user_id, parent_id: parent_id });
    const parent = await User.findById(parent_id);
    const passwordMatch = await bcrypt.compare(password, parent.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update the specified field with the new value
    user[field] = value;
    // Save the updated user to the database
    await user.save();

    // Return the updated user's information
    return res
      .status(200)
      .json({ message: "User field updated successfully", user });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const getUserById = async (req, res) => {
  const { user_id } = req.params; // Get the user ID from the request parameters

  try {
    // Fetch the user by ID from the database
    const user = await User.findById(user_id, "-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message,
    });
  }
};

// export const changePasswordDownline=async(req, res) => {
//   const token = req.headers.authorization; // Get the token from the request headers
//   const { user_id,new_password } = req.body;
//   if (!token) {
//     return res.status(401).json({ message: 'Unauthorized: Token not provided' });
//   }
//   try {
//     const plain_token = token.split(" ")[1];
//     const decodedToken = jwt.verify(plain_token, "sdlkjfdasnfmouficksdmnciavasdlkacnlk");
//     const parent_id = decodedToken.userId;
//     const user = await User.findOne({ _id: user_id, parent_id: parent_id });
//     const hashedNewPassword = await bcrypt.hash(new_password, 10);

//     // Update the user's password
//     user.password = hashedNewPassword;

//     // Save the updated user to the database
//     await user.save();
//     return res.status(200).json({ message: 'Password updated successfully' });
//   } catch (error) {
//     if (error instanceof jwt.JsonWebTokenError) {
//       return res.status(401).json({ message: 'Unauthorized: Invalid token' });
//     }
//     return res.status(500).json({ message: 'Something went wrong' });
//   }
// }

// export const updateUserStatus = async (req, res) => {
//   const token = req.headers.authorization; // Get the token from the request headers
//   const { status, user_id,password} = req.body; // Get the new status from the request body

//   if (!token) {
//     return res.status(401).json({ message: 'Unauthorized: Token not provided' });
//   }

//   try {
//     // Verify the token and extract parent_id
//     const plain_token = token.split(" ")[1];
//     const decodedToken = jwt.verify(plain_token, "sdlkjfdasnfmouficksdmnciavasdlkacnlk");
//     const parent_id = decodedToken.userId;

//     // Fetch the user based on user_id and parent_id
//     const user = await User.findOne({ _id: user_id, parent_id: parent_id });
//     const parent = await User.findById(parent_id)
//     const passwordMatch = await bcrypt.compare(password, parent.password);

//     if (!passwordMatch) {
//       return res.status(401).json({ message: 'Authentication failed' });
//     }
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }

//     // Update the user's status
//     user.status = status;

//     // Save the updated user to the database
//     await user.save();

//     // Return the updated user's information
//     return res.status(200).json({ message: 'User status updated successfully', user });
//   } catch (error) {
//     console.log("first error: " , error)
//     if (error instanceof jwt.JsonWebTokenError) {
//       return res.status(401).json({ message: 'Unauthorized: Invalid token' });
//     }
//     return res.status(500).json({ message: 'Something went wrong' });
//   }
// };

export const changePasswordDownline = async (req, res) => {
  const token = req.headers.authorization; // Get the token from the request headers
  const { user_id, new_password } = req.body;

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Token not provided" });
  }

  try {
    // Verify the token
    const plain_token = token.split(" ")[1];
    const decodedToken = jwt.verify(
      plain_token,
      "sdlkjfdasnfmouficksdmnciavasdlkacnlk"
    );

    // Fetch the authenticated user's user_id from the token
    const authenticatedUserId = decodedToken.userId;

    // Fetch the user based on user_id
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the authenticated user's user_id matches any parent ID of the user
    if (isUserAuthorized(user, authenticatedUserId)) {
      // Update the user's password
      const hashedNewPassword = await bcrypt.hash(new_password, 10);
      user.password = hashedNewPassword;

      // Save the updated user to the database
      await user.save();

      return res.status(200).json({ message: "Password updated successfully" });
    }

    return res.status(403).json({
      message:
        "Forbidden: You do not have permission to change this user's password",
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    return res.status(500).json({ message: "Something went wrong" });
  }
};
// Recursive function to check if user is authorized by user_id and password
const isUserAuthorizedforStatus = async (
  user,
  userIdToCheck,
  parentPassword
) => {
  const userParentId = user.parent_id.toString();
  if (!user.parent_id) {
    return false; // No more parent, authorization failed
  }
  if (userParentId === userIdToCheck) {
    const parent = await User.findById(userIdToCheck);
    if (!parent) {
      return false; // Parent not found, authorization failed
    }

    // Verify the password
    const passwordMatch = await bcrypt.compare(parentPassword, parent.password);

    if (passwordMatch) {
      return true; // Password matches, authorization successful
    } else {
      return false; // Password doesn't match, authorization failed
    }
  }
  const parentUser = await User.findById(user.parent_id);
  if (!parentUser) {
    return false; // Parent not found, authorization failed
  }
  return isUserAuthorizedforStatus(parentUser, userIdToCheck, parentPassword); // Recursively check the parent's parent
};

// Updated updateUserStatus function
export const updateUserStatus = async (req, res) => {
  const token = req.headers.authorization; // Get the token from the request headers
  const { status, user_id, password } = req.body; // Get the new status from the request body

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Token not provided" });
  }

  try {
    // Verify the token and extract parent_id
    const plain_token = token.split(" ")[1];
    const decodedToken = jwt.verify(
      plain_token,
      "sdlkjfdasnfmouficksdmnciavasdlkacnlk"
    );
    const parent_id = decodedToken.userId;

    // Fetch the user based on user_id
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the authenticated user has the permission to update status
    if (await isUserAuthorizedforStatus(user, parent_id, password)) {
      // Update the user's status
      user.status = status;

      // Save the updated user to the database
      await user.save();

      if (user.accountType !== "user") {
        if (status === "Active") {
          await User.updateMany(
            {
              [user.accountType]: user._id,
            },
            { upline_locked: false }
          );
        } else {
          await User.updateMany(
            {
              [user.accountType]: user._id,
            },
            { upline_locked: true }
          );
        }
      }

      // Return the updated user's information
      return res
        .status(200)
        .json({ message: "User status updated successfully", user });
    }

    return res.status(403).json({
      message:
        "Forbidden: You do not have permission to update this user's status",
    });
  } catch (error) {
    console.log("Error: ", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    return res.status(500).json({ message: "Something went wrong" });
  }
};

// Rest of your code remains the same

// Recursive function to check if user is authorized by user_id and password
// const isUserAuthorizedforStatus = async (user, userIdToCheck, parentPassword) => {
//   if (!user.parent_id) {
//     return false; // No more parent, authorization failed
//   }

//   if (user.parent_id === userIdToCheck) {
//     const parent = await User.findById(userIdToCheck);
//     if (!parent) {
//       return false; // Parent not found, authorization failed
//     }

//     // Verify the password
//     const passwordMatch = await bcrypt.compare(parentPassword, parent.password);

//     if (passwordMatch) {
//       return true; // Password matches, authorization successful
//     } else {
//       return false; // Password doesn't match, authorization failed
//     }
//   }

//   const parentUser = await User.findById(user.parent_id);
//   if (!parentUser) {
//     return false; // Parent not found, authorization failed
//   }

//   return isUserAuthorizedforStatus(parentUser, userIdToCheck, parentPassword); // Recursively check the parent's parent
// };

// // Updated updateUserStatus function
// export const updateUserStatus = async (req, res) => {
//   const token = req.headers.authorization; // Get the token from the request headers
//   const { status, user_id, password } = req.body; // Get the new status from the request body

//   if (!token) {
//     return res
//       .status(401)
//       .json({ message: "Unauthorized: Token not provided" });
//   }

//   try {
//     // Verify the token and extract parent_id
//     const plain_token = token.split(" ")[1];
//     const decodedToken = jwt.verify(
//       plain_token,
//       "sdlkjfdasnfmouficksdmnciavasdlkacnlk"
//     );
//     const parent_id = decodedToken.userId;

//     // Fetch the user based on user_id
//     const user = await User.findById(user_id);

//     if (!user) {
//       return res.status(404).json({ message: "User not found" });
//     }

//     // Check if the authenticated user has the permission to update status
//     if (isUserAuthorizedforStatus(user, parent_id, password)) {
//       // Update the user's status
//       user.status = status;

//       // Save the updated user to the database
//       await user.save();

//       // Return the updated user's information
//       return res
//         .status(200)
//         .json({ message: "User status updated successfully", user });
//     }

//     return res.status(403).json({
//       message:
//         "Forbidden: You do not have permission to update this user's status",
//     });
//   } catch (error) {
//     console.log("first error: ", error);
//     if (error instanceof jwt.JsonWebTokenError) {
//       return res.status(401).json({ message: "Unauthorized: Invalid token" });
//     }
//     return res.status(500).json({ message: "Something went wrong" });
//   }
// };

// Recursive function to check if user is authorized by user_id and password
// const isUserAuthorizedforStatus = async (user, userIdToCheck, parentPassword) => {
//   // if (user.parent_id === userIdToCheck) {
//   //   // Additional password verification logic here
//   //   const parent = await User.findById(userIdToCheck);
//   //   if (!parent) {
//   //     return false; // Parent not found, authorization failed
//   //   }

//   //   console.log("$2a$10$Ka.jLPfQOag.6BHganNuqOMWyI3P7jyMPF496NJWKpQo6Lkusdja6");
//   //   console.log(parent.password);
//   //   // Verify the password
//   //   const passwordMatch = await bcrypt.compare(parentPassword, parent.password);

//   //   if (passwordMatch) {
//   //     return false; // Password matches, authorization successful
//   //   } else {
//   //     return false; // Password doesn't match, authorization failed
//   //   }
//   // }

//   if (user.parent_id) {
//     // Fetch the parent user
//     // const parentUser = await User.findById(user.parent_id);

//     // if (!parentUser) {
//     //   return false; // Parent not found, authorization failed
//     // }
//     const parent = await User.findById(userIdToCheck);
//     if (!parent) {
//       return false; // Parent not found, authorization failed
//     }
//     if (user.parent_id === userIdToCheck) {
//       // Verify the password
//       const passwordMatch = await bcrypt.compare(parentPassword, parent.password);
//       console.log("$2a$10$Ka.jLPfQOag.6BHganNuqOMWyI3P7jyMPF496NJWKpQo6Lkusdja6");
//       console.log(parent.password);
//       if (!passwordMatch) {
//         return false; // Password matches, authorization successful
//       }
//       return isUserAuthorizedforStatus(parentUser, userIdToCheck, parentPassword); // Recursively check the parent's parent
//     }else{
//       return false;
//     }

//   }

//   return false; // No more parent, authorization failed
// };

// const isUserAuthorizedforStatus = async (
//   user,
//   userIdToCheck,
//   parentPassword
// ) => {
//   if (user.parent_id === userIdToCheck) {
//     // Additional password verification logic here
//     const parent = await User.findById(userIdToCheck);
//     if (!parent) {
//       return false; // Parent not found, authorization failed
//     }
//     console.log("parent_id matched");
//     const passwordMatch = await bcrypt.compare(parentPassword, parent.password);
//     console.log("$2a$10$Ka.jLPfQOag.6BHganNuqOMWyI3P7jyMPF496NJWKpQo6Lkusdja6");
//     console.log(parent.password);

//     console.log("password matched");
//     return passwordMatch; // Return true if the password matches
//   }

//   if (user.parent_id) {
//     // Fetch the parent user
//     const parentUser = await User.findById(user.parent_id);

//     if (!parentUser) {
//       return false; // Parent not found, authorization failed
//     }
//     console.log("authorized");
//     return isUserAuthorized(parentUser, userIdToCheck, parentPassword); // Recursively check the parent's parent
//   }

//   return false; // No more parent, authorization failed
// };

export const deleteUser = async (req, res) => {
  const token = req.headers.authorization; // Get the token from the request headers
  const { user_id, password } = req.body; // Get the user_id and password from the request body

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Token not provided" });
  }

  try {
    // Verify the token and extract parent_id
    const plain_token = token.split(" ")[1];
    const decodedToken = jwt.verify(
      plain_token,
      "sdlkjfdasnfmouficksdmnciavasdlkacnlk"
    );
    const parent_id = decodedToken.userId;

    const parent = await User.findById(parent_id);
    if (!parent) {
      return res.status(404).json({ message: "User not found" });
    }
    const passwordMatch = await bcrypt.compare(password, parent.password);
    // Fetch the user based on user_id
    if (!passwordMatch) {
      return res.status(400).json({ message: "Password not matching" });
    }
    const user = await User.findById(user_id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if the authenticated user has permission to delete the user
    if (await isUserAuthorized(user, parent_id)) {
      // Delete the user
      await User.findByIdAndRemove(user_id);

      return res.status(200).json({ message: "User deleted successfully" });
    }

    return res.status(403).json({
      message: "Forbidden: You do not have permission to delete this user",
    });
  } catch (error) {
    console.log("error: ", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    return res.status(500).json({ message: "Something went wrong", error });
  }
};

// Recursive function to check if user is authorized by user_id and password
// const isUserAuthorizedToDelete = async (user, userIdToCheck) => {
//  let flag = false
//   if (user.parent_id) {
//     // Fetch the parent user
//     const parentUser = await User.findById(user.parent_id);
//     console.log(parentUser)
//     if (parentUser===userIdToCheck) {
//       flag= true
//       return true; // Parent not found, authorization failed
//     }

//     return isUserAuthorizedToDelete(parentUser, userIdToCheck); // Recursively check the parent's parent
//   }
//   flag =false
//   return flag; // No more parent, authorization failed
// };

const isUserAuthorized = async (user, userIdToCheck) => {
  if (user.parent_id == userIdToCheck) {
    console.log("matched parent");
    return true; // The user's parent is authorized
  }

  if (user.parent_id) {
    // Fetch the parent user
    const parentUser = await User.findById(user.parent_id);
    console.log("parent", parentUser);
    if (!parentUser) {
      return false; // Parent not found, authorization failed
    }

    return isUserAuthorized(parentUser, userIdToCheck); // Recursively check the parent's parent
  }

  return false; // No more parent, authorization failed
};

// Function to get activity logs for the authenticated user
// export const getActivityLogById = async (req, res) => {
//   const user_id = req.params.user_id; // Get the token from the request headers

//   try {
//     // Fetch activity logs based on the user's ID from the decoded token
//     const userActivityLogs = await ActivityLog.find({
//       // Assuming user_id are stored in the activity logs
//       user_id: user_id,
//     })
//       .sort({ createdAt: -1 })
//       .select("-user_id"); // Sort by createdAt in descending order

//     return res.status(200).json({
//       success: true,
//       message: "Activity logs retrieved successfully",
//       data: userActivityLogs,
//     });
//   } catch (error) {
//     return res.status(500).json({ message: "Something went wrong", error });
//   }
// };

export const getActivityLogById = async (req, res) => {
  const user_id = req.params.user_id; // Get the user_id from the request parameters
  const { page = 1, limit = 10 } = req.query; // Get the page and limit from query parameters

  try {
    // Parse page and limit to integers
    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);

    // Calculate the number of documents to skip based on the page number and limit
    const skip = (pageNumber - 1) * limitNumber;

    // Fetch activity logs based on the user's ID from the decoded token with pagination
    const userActivityLogs = await ActivityLog.find({
      user_id: user_id,
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .select("-user_id"); // Sort by createdAt in descending order

    // Count the total number of activity logs for the user
    const totalCount = await ActivityLog.countDocuments({ user_id: user_id });

    // Calculate the total number of pages based on the total count and limit
    const totalPages = Math.ceil(totalCount / limitNumber);

    return res.status(200).json({
      success: true,
      message: "Activity logs retrieved successfully",
      data: userActivityLogs,
      pagination: {
        page: pageNumber,
        total: totalCount,
        totalPages: totalPages,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Something went wrong", error });
  }
};

export const creditRef = async (req, res) => {
  const token = req.headers.authorization; // Get the token from the request headers
  const { value, user_id, password } = req.body; // Get the field name, new value, and user_id from the request body

  if (!token) {
    return res
      .status(401)
      .json({ message: "Unauthorized: Token not provided" });
  }

  try {
    // Verify the token and extract parent_id
    const plain_token = token.split(" ")[1];
    const decodedToken = jwt.verify(
      plain_token,
      "sdlkjfdasnfmouficksdmnciavasdlkacnlk"
    );
    const parent_id = decodedToken.userId;

    // Fetch the user based on user_id and parent_id
    const user = await User.findOne({ _id: user_id, parent_id: parent_id });
    const parent = await User.findById(parent_id);
    const passwordMatch = await bcrypt.compare(password, parent.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: "Authentication failed" });
    }
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    if (!parent) {
      return res.status(404).json({ message: "Parent not found" });
    }
    const ref_PL = user.balance - value;
    // Update the specified field with the new value
    user.ref_PL = ref_PL;
    user.credit_ref = value;

    // Save the updated user to the database
    await user.save();

    // Return the updated user's information
    return res
      .status(200)
      .json({ message: "User credit_ref updated successfully", user });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Unauthorized: Invalid token" });
    }
    return res.status(500).json({ message: "Something went wrong" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { fromUserId, toUser, title, message, date } = req.body;

    if (!fromUserId || !toUser || !message) {
      return res.status(400).json({ message: "Incomplete message data" });
    }

    const newMessage = new Message({
      fromUserId,
      toUser,
      title,
      message,
      date,
    });

    await newMessage.save();

    res
      .status(201)
      .json({ message: "Message sent successfully", message: newMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getMessageList = async (req, res) => {
  try {
    const { userId } = req.params;
    const { filter, isShowing } = req.query;

    const query = { fromUserId: userId };
    if (filter) {
      query.toUser = filter;
    }

    if (isShowing) {
      query.isShowing = isShowing;
    }

    if (!userId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const messages = await Message.find(query).sort({
      date: -1,
    });

    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching message list:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateUser = async (req, res) => {
  try {
    const userId = req.user.userId; // Assuming you get the user ID from the request parameters
    const updates = req.body; // Assuming you receive the updates in the request body

    // If the updates include a new password, hash it before updating
    if (updates.password) {
      return res.status(403).json({ message: "You have no permission" });
    }

    // Find the user by ID and update the fields provided in the request body
    const user = await User.findByIdAndUpdate(userId, updates, { new: true });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "Update user successful" });
  } catch (error) {
    console.error("Error updating user:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateSettingLimits = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { gameType, listingType, newSettingLimits } = req.body;

    const result = await User.updateOne(
      {
        _id: userId,
        accountType: "white_level",
        settingLimits: {
          $elemMatch: { gameType, listingType },
        },
      },
      {
        $set: {
          "settingLimits.$.minAmount": newSettingLimits.minAmount,
          "settingLimits.$.maxAmount": newSettingLimits.maxAmount,
          "settingLimits.$.maxProfit": newSettingLimits.maxProfit,
          "settingLimits.$.oddsLimit": newSettingLimits.oddsLimit,
          "settingLimits.$.oddsLowerLimit": newSettingLimits.oddsLowerLimit,
          "settingLimits.$.betDelay": newSettingLimits.betDelay,
        },
      }
    );

    if (result.nModified === 0) {
      return res
        .status(404)
        .json({ message: "SettingLimits object not found" });
    }

    return res.status(200).json({ message: "Update settingLimits successful" });
  } catch (error) {
    console.error("Error updating settingLimits:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getDefaultSettings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const WL = await User.findById(user.white_level);
    if (!WL) {
      return res.status(404).json({ message: "White Level not found" });
    }
    if (WL.settingLimits.length <= 0) {
      return res
        .status(404)
        .json({ message: "SettingLimits object not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Successfully fetched default settings successful",
      data: {
        settingLimits: WL.settingLimits,
        beforeInplay: WL.beforeInplay,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const updateMessage = async (req, res) => {
  try {
    const { messageId } = req.params;
    const { updates } = req.body;

    // If the updates include a new password, hash it before updating
    if (updates.fromUserId) {
      return res.status(403).json({ message: "You have no permission" });
    }
    const updatedMessage = await Message.findByIdAndUpdate(messageId, updates, {
      new: true,
    });
    return res.status(200).json({
      message: "Update message successful",
      updatedMessage: updatedMessage,
    });
  } catch (error) {
    console.error("Error updating message:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { messageId } = req.params;

    const deletedMessage = await Message.findOneAndDelete({
      _id: messageId,
      fromUserId: userId,
      isLocked: false,
    });

    if (!deletedMessage) {
      return res.status(404).json({ message: "Message not found to delete" });
    }

    return res.status(200).json({
      message: "Delete message successful",
      deletedMessage: deletedMessage,
    });
  } catch (error) {
    console.error("Error deleting message:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

export const getWebSettings = async (req, res) => {
  try {
    // Extract the domain from the request parameters
    const { domain } = req.params;

    // Query the database for a user with the given domain
    const user = await User.findOne({ domain, accountType: "white_level" });

    // Check if a user with the given domain exists
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const userMarket = await BlockMarket.findOne({ userId: user._id });

    // If the user is found, send it in the response
    return res.status(200).json({
      success: true,
      data: {
        settingLimits: user.settingLimits,
        beforeInplay: user.beforeInplay,
        tvUrl: user.tvUrl,
        scoreUrl: user.scoreUrl,
        siteDown: user.siteDown,
        blockMarket: userMarket,
      },
    });
  } catch (error) {
    // Handle errors
    console.error("Error in getUserByDomain controller:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
};
