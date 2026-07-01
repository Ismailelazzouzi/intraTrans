import multer from "multer";
import path from "path";
import fs from "fs";
import { Request, Response, NextFunction } from "express";

const ALLOWED_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".pdf",
];

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const uploadDir = path.join(__dirname, "../../uploads");

const storage = multer.diskStorage({
    destination: (_req, _file, callback) => {
        callback(null, uploadDir);
    },

    filename: (_req, file, callback) => {
        const baseName = path.basename(file.originalname);
        const safeName = baseName.replace(/[^a-zA-Z0-9._-]/g, "_");
        const uniqueName = Date.now() + "-" + safeName;
        callback(null, uniqueName);
    }
});

const isValidFileMagicBytes = (filePath: string, ext: string): boolean => {
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
    // PDF: %PDF
    if (ext === '.pdf' &&
        buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) return true
    return false
}

const upload = multer({
    storage,

    fileFilter: (_req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        if (!ALLOWED_EXTENSIONS.includes(ext)) {
            return cb(
                new Error(`File type '${file.mimetype}' is not allowed.`)
            );
        }

        cb(null, true);
    },

    limits: {
        fileSize: MAX_FILE_SIZE,
        files: 1
    }
});

export const validateUploadedFile = (req: Request, res: Response, next: NextFunction) => {
    if (!req.file) return next()
    const ext = path.extname(req.file.originalname).toLowerCase()
    if (!isValidFileMagicBytes(req.file.path, ext)) {
        fs.unlinkSync(req.file.path)
        return res.status(400).json({ message: "Invalid file content" })
    }
    next()
}

export default upload;
