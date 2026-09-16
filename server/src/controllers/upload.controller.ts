import { Request, Response } from 'express';
import { UploadApiResponse } from 'cloudinary';
import { cloudinary } from '../config/cloudinary';
import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { logError, logInfo, logWarn } from '../utils/logger';

function uploadBufferToCloudinary(buffer: Buffer, publicId: string): Promise<UploadApiResponse> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: 'lms/salary-slips', public_id: publicId, resource_type: 'auto' },
      (err, result) => {
        if (err || !result) {
          reject(err ?? new Error('Cloudinary upload returned no result.'));
          return;
        }
        resolve(result);
      },
    );
    stream.end(buffer);
  });
}

export const uploadSalarySlipHandler = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    logWarn(`salary slip upload rejected for user ${req.user!.id}: no file in request`);
    throw ApiError.badRequest('No file was uploaded.', 'FILE_REQUIRED');
  }

  // publicId is prefixed with the uploader's user id so later requests (application
  // submit, salary-slip download) can verify a slip actually belongs to its claimed owner.
  const publicId = `${req.user!.id}-${Date.now()}`;

  let result: UploadApiResponse;
  try {
    result = await uploadBufferToCloudinary(req.file.buffer, publicId);
  } catch (err) {
    logError(`cloudinary upload failed for user ${req.user!.id} (${req.file.originalname})`, err);
    throw ApiError.badRequest('Could not upload the file. Please try again.', 'UPLOAD_FAILED');
  }

  logInfo(
    `salary slip uploaded: user ${req.user!.id}, ${req.file.originalname} (${req.file.size} bytes) -> ${result.secure_url}`,
  );

  res.status(201).json({
    salarySlip: {
      fileName: req.file.originalname,
      filePath: result.secure_url,
      mimeType: req.file.mimetype,
      sizeBytes: req.file.size,
      uploadedAt: new Date(),
    },
  });
});
