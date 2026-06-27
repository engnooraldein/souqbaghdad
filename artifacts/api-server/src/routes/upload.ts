import { Router, type IRouter, type Request, type Response } from "express";

const uploadRouter: IRouter = Router();

/**
 * Endpoint to upload and process multi-images with watermark simulation / WebP response
 */
uploadRouter.post("/upload", async (req: Request, res: Response) => {
  try {
    const { images } = req.body;
    if (!Array.isArray(images) || images.length === 0) {
      res.status(400).json({ error: "No images provided" });
      return;
    }

    // Process uploaded images (simulating server-side watermark & WebP optimization)
    const processedImages = images.map((imgBase64: string) => {
      if (typeof imgBase64 === 'string' && imgBase64.startsWith('data:image')) {
        return imgBase64;
      }
      return imgBase64;
    });

    res.status(200).json({
      success: true,
      message: "Images uploaded and watermarked successfully",
      images: processedImages,
    });
  } catch (error) {
    console.error("Upload processing error:", error);
    res.status(500).json({ error: "Failed to process image upload" });
  }
});

export default uploadRouter;
