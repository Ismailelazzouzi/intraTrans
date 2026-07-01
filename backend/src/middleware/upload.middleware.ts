import multer from "multer"
import path from "path"
import fs from "fs"
import { Request, Response, NextFunction } from "express"


const ALLOWED_EXTENSIONS = [
    ".jpeg",
    ".png",
    ".webp",
    ".jpg"
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export interface newRequest extends Request {
    file?: Express.Multer.File;
};

const uploadDir = path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, uploadDir)
    },
    filename: (_req, file, callback) =>{
        const baseName = path.basename(file.originalname);
        const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, "_")
        const uniqueName = Date.now() + "-" + safeName;
        callback(null, uniqueName);
    },
});

export const isValidImageBytes = (filePath: string): boolean => {
    const buf = Buffer.alloc(12)
    const fd = fs.openSync(filePath, 'r')
    fs.readSync(fd, buf, 0, 12, 0)
    fs.closeSync(fd)
    // JPEG: FF D8 FF
    if (buf[0] === 0xFF && buf[1] === 0xD8 && buf[2] === 0xFF) return true
    // PNG: 89 50 4E 47
    if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4E && buf[3] === 0x47) return true
    // WebP: RIFF....WEBP
    if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
        buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return true
    return false
}

export const upload = multer({
    storage,
    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext))
            return cb(new Error(`Extension '${ext}' is not allowed.`));
        cb(null, true);
    },
    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 2,
    },
});

const uploadMiddleware = [
    upload.fields([
        {name: "image1", maxCount: 1},
        {name: "image2", maxCount: 1}
    ]),
    (req: newRequest, res: Response, next: NextFunction) => {
        const files = req.files as {
            image1?: Express.Multer.File[],
            image2?: Express.Multer.File[],
        }
        if (!files?.image1 || !files?.image2)
            return res.status(400).json({ message: "Both images required" });

        const file1 = files.image1[0]
        const file2 = files.image2[0]

        if (!isValidImageBytes(file1.path) || !isValidImageBytes(file2.path)) {
            fs.unlinkSync(file1.path)
            fs.unlinkSync(file2.path)
            return res.status(400).json({ message: "Invalid image file" })
        }

        req.body.idVerificationImg = file1.filename;
        req.body.license = file2.filename;
        next();
    },
];

export default uploadMiddleware;
