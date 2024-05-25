/* eslint-disable @next/next/no-img-element */
import {
  MediaRenderer,
  Web3Button,
  useActiveClaimConditionForWallet,
  useAddress,
  useClaimConditions,
  useClaimIneligibilityReasons,
  useClaimerProofs,
  useContract,
  useContractMetadata,
  useNFT,
  useNFTBalance,
  useTotalCirculatingSupply,
  useUser,
} from "@thirdweb-dev/react";
import { NextPage } from "next";
import Head from "next/head";
import ImageSlider from "../components/ImageSlider";
import { useMemo, useState } from "react";
import { parseIneligibility } from "../utils/parseIneligibility";
import { BigNumber, utils } from "ethers";
import styles from "../styles/Theme.module.css";
import confetti from "canvas-confetti";
import { images, openerImage } from "../constants/galleryImages";

const Home: NextPage = () => {
  const address = useAddress();
  const user = useUser();

  const [quantity] = useState(1);
  const { contract: editionDrop } = useContract(
    process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!
  );
  const { data: contractMetadata } = useContractMetadata(editionDrop);

  const tokenId = Number(process.env.NEXT_PUBLIC_TOKEN_ID) || 0;

  const { data: nft, isLoading: isLoadingNft } = useNFT(editionDrop, tokenId);

  const claimConditions = useClaimConditions(editionDrop);
  const activeClaimCondition = useActiveClaimConditionForWallet(
    editionDrop,
    address,
    tokenId
  );
  const claimerProofs = useClaimerProofs(editionDrop, address || "", tokenId);
  const claimIneligibilityReasons = useClaimIneligibilityReasons(
    editionDrop,
    {
      quantity,
      walletAddress: address || "",
    },
    tokenId
  );

  const claimedSupply = useTotalCirculatingSupply(editionDrop, tokenId);

  const totalAvailableSupply = useMemo(() => {
    try {
      return BigNumber.from(activeClaimCondition.data?.availableSupply || 0);
    } catch {
      return BigNumber.from(1_000_000);
    }
  }, [activeClaimCondition.data?.availableSupply]);

  const numberClaimed = useMemo(() => {
    return BigNumber.from(claimedSupply.data || 0).toString();
  }, [claimedSupply]);

  const numberTotal = useMemo(() => {
    const n = totalAvailableSupply.add(BigNumber.from(claimedSupply.data || 0));
    if (n.gte(1_000_000)) {
      return "";
    }
    return n.toString();
  }, [totalAvailableSupply, claimedSupply]);

  const priceToMint = useMemo(() => {
    const bnPrice = BigNumber.from(
      activeClaimCondition.data?.currencyMetadata.value || 0
    );
    return `${utils.formatUnits(
      bnPrice.mul(quantity).toString(),
      activeClaimCondition.data?.currencyMetadata.decimals || 18
    )} ${activeClaimCondition.data?.currencyMetadata.symbol}`;
  }, [
    activeClaimCondition.data?.currencyMetadata.decimals,
    activeClaimCondition.data?.currencyMetadata.symbol,
    activeClaimCondition.data?.currencyMetadata.value,
    quantity,
  ]);

  const maxClaimable = useMemo(() => {
    let bnMaxClaimable;
    try {
      bnMaxClaimable = BigNumber.from(
        activeClaimCondition.data?.maxClaimableSupply || 0
      );
    } catch (e) {
      bnMaxClaimable = BigNumber.from(1_000_000);
    }

    let perTransactionClaimable;
    try {
      perTransactionClaimable = BigNumber.from(
        activeClaimCondition.data?.maxClaimablePerWallet || 0
      );
    } catch (e) {
      perTransactionClaimable = BigNumber.from(1_000_000);
    }

    if (perTransactionClaimable.lte(bnMaxClaimable)) {
      bnMaxClaimable = perTransactionClaimable;
    }

    const snapshotClaimable = claimerProofs.data?.maxClaimable;

    if (snapshotClaimable) {
      if (snapshotClaimable === "0") {
        // allowed unlimited for the snapshot
        bnMaxClaimable = BigNumber.from(1_000_000);
      } else {
        try {
          bnMaxClaimable = BigNumber.from(snapshotClaimable);
        } catch (e) {
          // fall back to default case
        }
      }
    }

    let max;
    if (totalAvailableSupply.lt(bnMaxClaimable)) {
      max = totalAvailableSupply;
    } else {
      max = bnMaxClaimable;
    }

    if (max.gte(1_000_000)) {
      return 1_000_000;
    }
    return max.toNumber();
  }, [
    claimerProofs.data?.maxClaimable,
    totalAvailableSupply,
    activeClaimCondition.data?.maxClaimableSupply,
    activeClaimCondition.data?.maxClaimablePerWallet,
  ]);

  const isSoldOut = useMemo(() => {
    try {
      return (
        (activeClaimCondition.isSuccess &&
          BigNumber.from(activeClaimCondition.data?.availableSupply || 0).lte(
            0
          )) ||
        numberClaimed === numberTotal
      );
    } catch (e) {
      return false;
    }
  }, [
    activeClaimCondition.data?.availableSupply,
    activeClaimCondition.isSuccess,
    numberClaimed,
    numberTotal,
  ]);

  const canClaim = useMemo(() => {
    return (
      activeClaimCondition.isSuccess &&
      claimIneligibilityReasons.isSuccess &&
      claimIneligibilityReasons.data?.length === 0 &&
      !isSoldOut
    );
  }, [
    activeClaimCondition.isSuccess,
    claimIneligibilityReasons.data?.length,
    claimIneligibilityReasons.isSuccess,
    isSoldOut,
  ]);

  const { data: balance } = useNFTBalance(
    editionDrop,
    address,
    nft?.metadata.id
  );

  const buttonText = useMemo(() => {
    if (isSoldOut) {
      return "Sold Out";
    }

    if (balance?.toNumber() ?? 0 > 0) {
      return "NFT minted ✅";
    }

    if (canClaim) {
      const pricePerToken = BigNumber.from(
        activeClaimCondition.data?.currencyMetadata.value || 0
      );
      if (pricePerToken.eq(0)) {
        return "Mint (Free)";
      }
      return `Mint (${priceToMint})`;
    }
    if (claimIneligibilityReasons.data?.length) {
      return parseIneligibility(claimIneligibilityReasons.data, quantity);
    }
    if (claimIneligibilityReasons.isLoading) {
      return "Checking eligibility...";
    }

    return "Claiming not available";
  }, [
    isSoldOut,
    balance,
    canClaim,
    claimIneligibilityReasons.data,
    claimIneligibilityReasons.isLoading,
    activeClaimCondition.data?.currencyMetadata.value,
    priceToMint,
    quantity,
  ]);

  if (isLoadingNft) {
    return (
      <main>
        <Head>
          <title>Your Digital Keepsake - UvA EB Challenge</title>
        </Head>
        <div className={styles.mintInfoContainer}>Loading...</div>
      </main>
    );
  }

  return (
    <main>
      <Head>
        <title>Your Digital Keepsake - UvA EB Challenge</title>
      </Head>
      <div className={styles.mintInfoContainer}>
        <>
          <div className={`${styles.infoSide} order-3 md:order-1`}>
            <ImageSlider
              items={balance?.toNumber() ?? 0 > 0 ? images : openerImage}
              showPlayButton={balance?.toNumber() ?? 0 > 0 ? true : false}
              showFullscreenButton={balance?.toNumber() ?? 0 > 0 ? true : false}
            />
          </div>
          <div className='h-full w-full md:w-1/4 mb-2 md:mb-0 order-1 md:order-2'>
            {/* Title of your NFT Collection */}
            {/* <h1 className='ml-[5%] md:ml-0'>{contractMetadata?.name}</h1> */}
            <h1 className='ml-[5%] md:ml-0'>UvA EB Challenge 2024</h1>
            {/* Description of your NFT Collection */}
            <p className={`${styles.description} ml-[5%] md:ml-0`}>
              Your Digital Keepsake
            </p>
          </div>

          <div className={`${styles.imageSide} order-2 md:order-3`}>
            {/* Image Preview of NFTs */}
            <img
              className={styles.image}
              src={contractMetadata?.image ?? "/images/gallery/03-666x666.jpg"}
              alt={`${contractMetadata?.name} preview image`}
              width='666px'
              height='666px'
            />

            {/* Amount claimed so far */}
            <div className={`${styles.mintCompletionArea} mt-2`}>
              <div className={styles.mintAreaLeft}>
                <p>Total Minted</p>
              </div>
              <div className={styles.mintAreaRight}>
                {claimedSupply ? (
                  <p>
                    <b>{numberClaimed}</b>
                    {" / "}
                    {numberTotal || "∞"}
                  </p>
                ) : (
                  // Show loading state if we're still loading the supply
                  <p>Loading...</p>
                )}
              </div>
            </div>

            {claimConditions.data?.length === 0 ||
            claimConditions.data?.every(
              (cc) => cc.maxClaimableSupply === "0"
            ) ? (
              <div>
                <h2>
                  This drop is not ready to be minted yet. (No claim condition
                  set)
                </h2>
              </div>
            ) : (
              <>
                {/* <p>Quantity</p>
                  <div className={styles.quantityContainer}>
                    <button
                      className={`${styles.quantityControlButton}`}
                      onClick={() => setQuantity(quantity - 1)}
                      disabled={quantity <= 1}
                    >
                      -
                    </button>

                    <h4>{quantity}</h4>

                    <button
                      className={`${styles.quantityControlButton}`}
                      onClick={() => setQuantity(quantity + 1)}
                      disabled={quantity >= maxClaimable}
                    >
                      +
                    </button>
                  </div> */}

                <div
                  className={`flex flex-row align-center justify-center gap-4 mt-6 mb-6 md:mb-0`}
                >
                  <div className='flex flex-col gap-4'>
                    {!!address && (
                      <Web3Button
                        contractAddress={editionDrop?.getAddress() || ""}
                        action={(cntr) => cntr.erc1155.claim(tokenId, quantity)}
                        isDisabled={
                          !canClaim ||
                          claimIneligibilityReasons.isLoading ||
                          (balance?.toNumber() ?? 0) > 0
                        }
                        onError={() =>
                          alert("Something went wrong. Please try again.")
                        }
                        onSuccess={() => confetti()}
                      >
                        {claimIneligibilityReasons.isLoading
                          ? "Loading..."
                          : buttonText}
                      </Web3Button>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      </div>
    </main>
  );
};

export default Home;
