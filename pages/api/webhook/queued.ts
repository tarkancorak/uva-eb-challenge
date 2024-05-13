import type { NextApiRequest, NextApiResponse } from "next";
import crypto from "node:crypto";

const generateSignature = (
  body: string,
  timestamp: string,
  secret: string
): string => {
  const payload = `${timestamp}.${body}`;
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
};

const isValidSignature = (
  body: string,
  timestamp: string,
  signature: string,
  secret: string
): boolean => {
  const expectedSignature = generateSignature(body, timestamp, secret);
  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(signature)
  );
};

const isExpired = (timestamp: string, expirationInSeconds: number): boolean => {
  const currentTime = Math.floor(Date.now() / 1000);
  return currentTime - parseInt(timestamp) > expirationInSeconds;
};

type ResponseData = {
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    return res
      .status(500)
      .json({ message: "Unsupported method for the queued webhook" });
  }

  console.log("Webhook for the queued event received:", req.body);
  const signatureFromHeader = req.headers["X-Engine-Signature"]?.toString();
  const timestampFromHeader = req.headers["X-Engine-Timestamp"]?.toString();

  if (!signatureFromHeader || !timestampFromHeader) {
    return res
      .status(401)
      .json({ message: "Missing signature or timestamp header" });
  }

  if (
    !isValidSignature(
      req.body,
      timestampFromHeader,
      signatureFromHeader,
      process.env.ENGINE_QUEUED_WEBHOOK_SECRET!
    )
  ) {
    return res.status(401).json({ message: "Invalid signature" });
  }

  if (isExpired(timestampFromHeader, 300)) {
    // Assuming expiration time is 5 minutes (300 seconds)
    return res.status(401).json({ message: "Request has expired" });
  }

  // Process the request
  console.log("+++ Hello rom queued webhook");
  res.status(200).json({ message: "Webhook received!" });
}
