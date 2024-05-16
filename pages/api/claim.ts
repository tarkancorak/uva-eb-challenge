import { PolygonAmoyTestnet } from "../_app";
import { Engine } from "@thirdweb-dev/engine";
import { NextApiRequest, NextApiResponse } from "next";
// import { NFT_CONTRACT_ADDRESS } from "../../constants/constants";
import { getUser } from "./auth/[...thirdweb]";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res
      .status(500)
      .json({ message: "Unsupported method for the claim route" });
  }

  try {
    const user = await getUser(req);

    if (!user) {
      return res.status(401).json({
        message: "Not authorized.",
      });
    }

    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    const { address } = user;
    const contractAddress = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!;
    // const tokenId = req.body.tokenId;
    const tokenId = process.env.NEXT_PUBLIC_TOKEN_ID!;
    const chainId = PolygonAmoyTestnet.chainId.toString();
    const backendWallet = process.env.BACKEND_WALLET!;
    // console.log("+++ claim:", { user, address, tokenId });

    const engine = new Engine({
      url: process.env.ENGINE_URL!,
      accessToken: process.env.ENGINE_ACCESS_TOKEN!,
    });

    // console.log("+++ Engine created. Claiming:", {
    //   chainId,
    //   address,
    //   contractAddress,
    //   tokenId,
    //   backendWallet,
    // });

    const response: any = await engine.erc1155.claimTo(
      // Sepolia.chainId.toString(),
      chainId,
      contractAddress,
      backendWallet,
      {
        receiver: address,
        tokenId,
        quantity: "1",
      }
    );

    const queueId = response?.result?.queueId;
    console.log("Got queueId: ", queueId);
    return res.status(200).send({ message: "claimed", queueId });

    // const sleep = (duration: number) =>
    //   new Promise((resolve) => setTimeout(resolve, duration));

    // let response;
    // for (let i = 0; i < 7; i++) {
    //   response = await engine.transaction.status(queueId);
    //   console.log("+++ Received status:", response?.result?.status);
    //   if (["mined", "failed"].includes(response?.result?.status ?? "")) {
    //     console.log("+++ Status found. Break!");
    //     break;
    //   }
    //   await sleep(500);
    // }

    // if (response?.result?.status === "failed") {
    //   console.log("+++ Claim failed.", response);
    //   return res.status(500).send({ message: "Claim failed" });
    // } else {
    //   return res.status(200).send({ message: "claimed", queueId });
    // }
  } catch (error) {
    console.error("+++ error while claiming:", error);
    return res.status(500).send({ message: JSON.stringify(error) });
  } finally {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";
  }
}
