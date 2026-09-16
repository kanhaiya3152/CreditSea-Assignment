import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { ALLOWED_UPLOAD_MIMETYPES, MAX_UPLOAD_BYTES } from '../utils/constants';
import { ApiError } from '../utils/ApiError';

// Files are held in memory only long enough to stream to Cloudinary - never written to local disk.
const storage = multer.memoryStorage();

const fileFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
  if (!ALLOWED_UPLOAD_MIMETYPES.includes(file.mimetype)) {
    cb(ApiError.badRequest('Only PDF, JPG, or PNG files are accepted.', 'INVALID_FILE_TYPE'));
    return;
  }
  cb(null, true);
};

export const uploadSalarySlip = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_UPLOAD_BYTES },
}).single('salarySlip');
