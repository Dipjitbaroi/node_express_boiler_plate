import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../model/user.model.js";
dotenv.config();
export const checkToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // const authDevice = req.headers.device_id;

  if (authHeader) {
    const token = authHeader.split(" ")[1];
    new Promise((resolve, reject) => {
      jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
        if (err) {
          reject(err);
        } else {
          resolve(user);
        }
      });
    })
      .then(async (user) => {
        const activeUser = await User.findOne({
          _id: user.userId,
          deviceId: user.deviceId,
        });
        if (!activeUser) {
          return res.sendStatus(403);
        }
        req.user = user;
        next();
      })
      .catch((err) => {
        res.sendStatus(403);
      });
  } else {
    // console.log({ authHeader });
    // console.log({ authDevice });
    res.sendStatus(401);
  }
};

export const checkCasinoToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log({ authHeader });

  if (authHeader) {
    const token = authHeader;
    jwt.verify(token, process.env.CASINO_SECRET, (err, user) => {
      console.log(user);
      if (err) {
        return res.sendStatus(403);
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};
