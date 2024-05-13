import {
  MediaRenderer,
  Web3Button,
  useAddress,
  useClaimConditions,
  useContract,
  useNFT,
  useNFTBalance,
} from "@thirdweb-dev/react";
import { NFT } from "@thirdweb-dev/sdk";
import { GIFT_URI, NFT_CONTRACT_ADDRESS } from "../constants/constants";
import { useState } from "react";
import confetti from "canvas-confetti";

type GiftProps = {
  nft: NFT;
  isOwner: boolean;
};

export default function Gift({ nft, isOwner }: GiftProps) {
  const address = useAddress();

  const etherscanURL = `https://sepolia.etherscan.io/token/${NFT_CONTRACT_ADDRESS}?a=${nft?.metadata.id}`;

  const currentDate = new Date();

  const { contract } = useContract(NFT_CONTRACT_ADDRESS);

  const { data } = useNFT(contract, nft?.metadata.id);

  const { data: isOwned, isLoading: isLoadingOwned } = useNFTBalance(
    contract,
    address,
    nft?.metadata.id
  );

  const [error, setError] = useState<any>(null);
  const [queueId, setQueueId] = useState(null);
  const [lastClaimedId, setLastClaimedId] = useState<string | null>(null);
  const [isClaimed, setIsClaimed] = useState<boolean>(false);

  const { data: claimConditions, isLoading: isLoadingClaimCondition } =
    useClaimConditions(contract, nft?.metadata.id);

  const publicClaimCondition = claimConditions?.find(
    (cc) => cc?.metadata?.name !== "Only Owner phase"
  );
  const ownerClaimCondition = claimConditions?.find(
    (cc) => cc?.metadata?.name === "Only Owner phase"
  );

  const claimCondition = isOwner
    ? ownerClaimCondition || publicClaimCondition
    : publicClaimCondition;

  const claim = async () => {
    try {
      setLastClaimedId(null);
      setQueueId(null);
      const result = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: nft?.metadata.id }),
      });
      const json = await result.json();
      if (!result.ok || result.status !== 200) {
        throw new Error(json);
      }
      setQueueId(json?.queueId);
      confetti();
      setLastClaimedId(nft?.metadata?.id);
      setIsClaimed(true);
      return Promise.resolve(json);
    } catch (error) {
      setError(error);
      alert("Failed. Please try again!");
    }
  };

  if (!claimCondition) {
    return null;
  }

  const isDatePassed = claimCondition && claimCondition.startTime < currentDate;

  const displayGiftDay = parseInt(nft.metadata.id) + 1;

  const isFirst = nft.metadata.id === "0";
  const supply = isFirst
    ? publicClaimCondition?.maxClaimableSupply
    : nft?.supply;

  const claimedCnd = isClaimed ? Number(supply) || 0 + 1 : Number(supply) || 0;

  const isSoldOut =
    isFirst || nft?.supply === publicClaimCondition?.maxClaimableSupply;
  const supplyLabel = isClaimed
    ? `${claimedCnd} / ${publicClaimCondition?.maxClaimableSupply}`
    : `${supply} / ${publicClaimCondition?.maxClaimableSupply}`;

  const supplyLabelBg = isSoldOut ? "bg-red-800" : "bg-green-800";
  const supplyLabelCol = isSoldOut ? "text-red-300" : "text-green-300";

  return (
    <div className='flex flex-col my-10 mx-auto max-w-screen-2xl'>
      <div className='relative'>
        {!isLoadingOwned &&
          !isLoadingClaimCondition &&
          (isOwned || isClaimed) && (
            <>
              <MediaRenderer
                src={
                  isDatePassed &&
                  ((isOwned && isOwned.toNumber() > 0) || isClaimed)
                    ? nft.metadata.image
                    : GIFT_URI
                }
                className='rounded-t-lg'
              />
              <div className='flex justify-center items-center absolute top-1 left-1 text-black text-lg font-bold py-1 px-2 rounded-full bg-white w-10 h-10'>
                <div>{displayGiftDay}</div>
              </div>
              {publicClaimCondition && (isClaimed || isDatePassed) && (
                <div
                  className={`absolute bottom-1 right-1 ${supplyLabelCol} ${supplyLabelBg} opacity-90 rounded-lg px-2 py-1 w-1/4 text-xs text-center`}
                >
                  <a
                    href={etherscanURL}
                    target='_blank'
                    title='view on etherscan'
                    className='no-underline'
                  >
                    {supplyLabel}
                  </a>
                </div>
              )}
            </>
          )}
      </div>
      {address && ((isOwned && isOwned?.toNumber() > 0) || isClaimed) ? (
        <button className='p-2 w-full text-green-300 bg-green-800 bg-forest-green opacity-90 rounded-b-lg'>
          Claimed ✅
        </button>
      ) : (
        <Web3Button
          contractAddress={NFT_CONTRACT_ADDRESS}
          action={claim}
          isDisabled={
            !isDatePassed || (isOwned && isOwned.toNumber() > 0) || isSoldOut
          }
          className='text-lg font-bold p-2 w-full'
          style={{
            backgroundColor: isDatePassed ? "#FFF" : "#ccc",
            color: "#333",
            borderRadius: "0 0 10px 10px",
            width: "100%",
            marginTop: "1px",
          }}
        >
          {isSoldOut
            ? "SOLD OUT"
            : isDatePassed
            ? "Claim NFT"
            : claimCondition.startTime.toLocaleDateString()}
        </Web3Button>
      )}
    </div>
  );
}
