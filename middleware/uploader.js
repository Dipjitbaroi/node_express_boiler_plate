import multer from "multer";
import path from "path";

// Create a Multer instance for handling file uploads
export const uploadCompanyFiles = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "files/companyfiles/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
});

export const uploadUserfiles = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "files/userfiles/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
});

export const uploadTicketFiles = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "files/ticketfiles/");
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  }),
});
