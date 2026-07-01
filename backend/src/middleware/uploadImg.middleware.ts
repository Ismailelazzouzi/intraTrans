import { upload, isValidImageBytes } from "./upload.middleware";
import { Request, Response, NextFunction } from "express";
import fs from "fs";

const uploadImgMiddleware = [
  upload.single("imageUrl"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.file) {
      if (!isValidImageBytes(req.file.path)) {
        fs.unlinkSync(req.file.path)
        return res.status(400).json({ message: "Invalid image file" })
      }
      req.body.imageUrl = req.file.filename;
    }

    next();
  },
];

export default uploadImgMiddleware;
