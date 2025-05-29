import { S3 } from "@aws-sdk/client-s3";

const s3Client = new S3({
  endpoint: process.env.DO_SPACE_ENDPOINT,
  region: process.env.DO_SPACE_REGION,
  credentials: {
    accessKeyId: process.env.DO_SPACE_ACCESS_KEY,
    secretAccessKey: process.env.DO_SPACE_SECRET_KEY,
  },
  forcePathStyle: true,
});

export async function uploadToSpaces(file, folder = "") {
  try {
    // Convert file to buffer if it's not already
    const buffer =
      file instanceof Buffer ? file : Buffer.from(await file.arrayBuffer());
    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.name || "file";
    // FIX: Do not prepend bucket name to key
    const fileName = `${folder}/${timestamp}-${originalName.replace(
      /[^a-zA-Z0-9.-]/g,
      "-"
    )}`;

    // Upload to DO Spaces
    await s3Client.putObject({
      Bucket: process.env.DO_SPACE_BUCKET,
      Key: fileName,
      Body: buffer,
      ACL: "public-read",
      ContentType: file.type || "application/octet-stream",
    });
    // Return the public URL
    return `${process.env.DO_SPACE_ENDPOINT}/${process.env.DO_SPACE_BUCKET}/${fileName}`;
  } catch (error) {
    console.error("Error uploading to DO Spaces:", error);
    throw error;
  }
}

export async function deleteFromSpaces(fileUrl) {
  try {
    if (!fileUrl) return;

    // Extract the key from the URL
    // For URLs like https://jrv-mahal.nyc3.digitaloceanspaces.com/jrv-mahal/gallery/filename
    // FIX: Only extract the part after the bucket name
    const urlParts = fileUrl.split(`.digitaloceanspaces.com/`);
    if (urlParts.length < 2) {
      console.error("Could not extract key from URL:", fileUrl);
      return false;
    }
    let key = urlParts[1];
    // Remove leading bucket name if present
    const bucketPrefix = `${process.env.DO_SPACE_BUCKET}/`;
    if (key.startsWith(bucketPrefix)) {
      key = key.slice(bucketPrefix.length);
    }

    console.log("Deleting file with key:", key);

    await s3Client.deleteObject({
      Bucket: process.env.DO_SPACE_BUCKET,
      Key: key,
    });

    return true;
  } catch (error) {
    console.error("Error deleting from DO Spaces:", error);
    throw error;
  }
}
