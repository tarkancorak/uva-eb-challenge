import { PolygonAmoyTestnet } from "../_app";
import { Engine } from "@thirdweb-dev/engine";
import { NextApiRequest, NextApiResponse } from "next";
// import { NFT_CONTRACT_ADDRESS } from "../../constants/constants";
import { getUser } from "./auth/[...thirdweb]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "GET") {
    return res
      .status(500)
      .json({ message: "Unsupported method for the status route" });
  }

  try {
    const user = await getUser(req);

    if (!user) {
      return res.status(401).json({
        message: "Not authorized.",
      });
    }

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const { queueId } = req.query;
    console.log("+++ status:", { queueId, query: req.query });

    if (!queueId) {
      res.status(500).send({ message: "Invalid queueId" });
    }

    const engine = new Engine({
      url: process.env.ENGINE_URL!,
      accessToken: process.env.ENGINE_ACCESS_TOKEN!,
    });

    const response: any = await engine.transaction.status(
      queueId?.toString() ?? ""
    );

    // console.log("+++ result:", JSON.stringify(response.result, null, 2));
    return res.status(200).send({ status: response.result?.status });
  } catch (error) {
    console.error("+++ error:", error);
    return res.status(500).send({ message: JSON.stringify(error) });
  } finally {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
  }
}
