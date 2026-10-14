import { randomUUID } from "node:crypto";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { Storage, type File } from "@google-cloud/storage";

const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";
const objectStorageClient = new Storage({
  credentials: {
    audience: "replit",
    subject_token_type: "access_token",
    token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
    type: "external_account",
    credential_source: {
      url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
      format: {
        type: "json",
        subject_token_field_name: "access_token",
      },
    },
    universe_domain: "googleapis.com",
  },
  projectId: "",
});

const MEDIA_TYPES = {
  image: {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "image/avif": "avif",
  },
  video: {
    "video/mp4": "mp4",
    "video/webm": "webm",
    "video/quicktime": "mov",
  },
} as const;

type MediaKind = keyof typeof MEDIA_TYPES;

function parseObjectPath(path: string): { bucketName: string; objectName: string } {
  const parts = path.replace(/^\/+/, "").split("/");
  if (parts.length < 2 || !parts[0] || parts.slice(1).some((part) => !part)) {
    throw new Error("Invalid App Storage object path.");
  }
  return { bucketName: parts[0], objectName: parts.slice(1).join("/") };
}

function objectPathFor(mediaId: string): { bucketName: string; objectName: string } {
  const privateDir = process.env.PRIVATE_OBJECT_DIR?.replace(/\/+$/, "");
  if (!privateDir) {
    throw new Error("PRIVATE_OBJECT_DIR is not configured for generated media.");
  }
  return parseObjectPath(`${privateDir}/modelark/${mediaId}`);
}

function mediaContentType(kind: MediaKind, rawContentType: string): {
  contentType: string;
  extension: string;
} {
  const contentType = rawContentType.split(";")[0]?.trim().toLowerCase();
  const extension = contentType && MEDIA_TYPES[kind][contentType as keyof (typeof MEDIA_TYPES)[MediaKind]];
  if (!contentType || !extension) {
    throw new Error(`ModelArk returned an unsupported ${kind} media type.`);
  }
  return { contentType, extension };
}

export async function storeModelArkMedia(
  source: Readable,
  {
    kind,
    contentType: rawContentType,
    maxBytes,
  }: {
    kind: MediaKind;
    contentType: string;
    maxBytes: number;
  },
): Promise<string> {
  const { contentType, extension } = mediaContentType(kind, rawContentType);
  const mediaId = `${randomUUID()}.${extension}`;
  const { bucketName, objectName } = objectPathFor(mediaId);
  const file = objectStorageClient.bucket(bucketName).file(objectName);
  let receivedBytes = 0;
  const sizeLimit = new Transform({
    transform(chunk: Buffer | string, _encoding, callback) {
      receivedBytes += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
      if (receivedBytes > maxBytes) {
        callback(new Error(`Generated ${kind} exceeds the storage size limit.`));
        return;
      }
      callback(null, chunk);
    },
  });

  try {
    await pipeline(
      source,
      sizeLimit,
      file.createWriteStream({
        resumable: false,
        metadata: {
          contentType,
          cacheControl: "public, max-age=31536000, immutable",
        },
      }),
    );
  } catch (error) {
    await file.delete({ ignoreNotFound: true }).catch(() => undefined);
    throw error;
  }

  return `/api/modelark/media/${mediaId}`;
}

export function imageBufferSource(buffer: Buffer): Readable {
  return Readable.from([buffer]);
}

export async function findModelArkMedia(mediaId: string): Promise<File | null> {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:png|jpg|webp|avif|mp4|webm|mov)$/i.test(mediaId)) {
    return null;
  }
  const { bucketName, objectName } = objectPathFor(mediaId);
  const file = objectStorageClient.bucket(bucketName).file(objectName);
  const [exists] = await file.exists();
  return exists ? file : null;
}
