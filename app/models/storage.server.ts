import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

let r2Client: S3Client | null = null;

function getR2Config() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    return null;
  }

  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucketName,
  };
}

export function isStorageConfigured() {
  return getR2Config() !== null;
}

function getR2Client() {
  const config = getR2Config();
  if (!config) {
    throw new Error("Object storage is not configured");
  }

  if (!r2Client) {
    r2Client = new S3Client({
      region: "auto",
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  }

  return { client: r2Client, bucketName: config.bucketName };
}

export function buildItemPhotoKey(
  itemId: string,
  extension: "webp" | "jpeg"
) {
  return `items/${itemId}/${randomUUID()}.${extension === "jpeg" ? "jpg" : "webp"}`;
}

export function getContentTypeForPhotoKey(photoKey: string) {
  if (photoKey.endsWith(".webp")) {
    return "image/webp";
  }

  if (photoKey.endsWith(".jpg") || photoKey.endsWith(".jpeg")) {
    return "image/jpeg";
  }

  return "application/octet-stream";
}

export async function uploadObject({
  key,
  body,
  contentType,
}: {
  key: string;
  body: Buffer;
  contentType: string;
}) {
  const { client, bucketName } = getR2Client();

  await client.send(
    new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: body,
      ContentType: contentType,
    })
  );
}

export async function deleteObject({ key }: { key: string }) {
  const { client, bucketName } = getR2Client();

  await client.send(
    new DeleteObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );
}

export async function getObject({ key }: { key: string }) {
  const { client, bucketName } = getR2Client();

  const response = await client.send(
    new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    })
  );

  if (!response.Body) {
    return null;
  }

  const body = Buffer.from(await response.Body.transformToByteArray());

  return {
    body,
    contentType: response.ContentType ?? getContentTypeForPhotoKey(key),
  };
}
