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
  useNFTBalance,
  useNFTs,
  useTotalCirculatingSupply,
  useUser,
} from "@thirdweb-dev/react";
import { NextPage } from "next";
import Head from "next/head";
import ImageSlider from "../components/ImageSlider";
import { useEffect, useMemo, useRef, useState } from "react";
import { parseIneligibility } from "../utils/parseIneligibility";
import { BigNumber, utils } from "ethers";
import styles from "../styles/Theme.module.css";
import confetti from "canvas-confetti";
import { images, openerImage } from "../constants/galleryImages";
import toast from "react-hot-toast";
const Home: NextPage = () => {
  const address = useAddress();
  const user = useUser();

  const [quantity, setQuantity] = useState(1);
  const { contract: editionDrop } = useContract(
    process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS!
  );
  const { data: contractMetadata } = useContractMetadata(editionDrop);
  const { data: nfts, isLoading: isLoadingNfts } = useNFTs(editionDrop);

  const tokenId = Number(process.env.NEXT_PUBLIC_TOKEN_ID) || 0;

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

  const isLoading = useMemo(() => {
    return (
      isLoadingNfts ||
      activeClaimCondition.isLoading ||
      claimedSupply.isLoading ||
      !editionDrop
    );
  }, [
    isLoadingNfts,
    activeClaimCondition.isLoading,
    editionDrop,
    claimedSupply.isLoading,
  ]);

  const nft = nfts?.[0];

  const { data: balance } = useNFTBalance(
    editionDrop,
    address,
    nft?.metadata.id
  );

  const buttonLoading = useMemo(
    () => isLoading || claimIneligibilityReasons.isLoading,
    [claimIneligibilityReasons.isLoading, isLoading]
  );

  const [isMinted, setIsMinted] = useState(false);
  const [isFailed, setIsFailed] = useState(false);
  const mintingStatus = useRef(null);

  const buttonText = useMemo(() => {
    if (isSoldOut) {
      return "Sold Out";
    }

    if ((balance?.toNumber() ?? 0 > 0) || isMinted) {
      return "NFT minted ✅";
    }

    if (!user?.isLoggedIn) {
      return "Please sign in to mint your NFT!";
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
    if (buttonLoading) {
      return "Checking eligibility...";
    }

    return "Claiming not available";
  }, [
    isSoldOut,
    balance,
    isMinted,
    user?.isLoggedIn,
    canClaim,
    claimIneligibilityReasons.data,
    buttonLoading,
    activeClaimCondition.data?.currencyMetadata.value,
    priceToMint,
    quantity,
  ]);

  const getMintedStatus = async (queueId: string) => {
    const sleep = (duration: number) =>
      new Promise((resolve) => setTimeout(resolve, duration));

    let response;
    for (let i = 0; i < 50; i++) {
      response = await fetch(`/api/status/?queueId=${queueId}`);
      const json = await response.json();
      if (mintingStatus.current !== json?.status) {
        mintingStatus.current = json.status;
        console.log("+++ Received status:", mintingStatus.current);
        toast(`Minting Status: ${mintingStatus.current}`);
      }
      if (json.status === "mined") {
        setIsMinted(true);
        setIsFailed(false);
        mintingStatus.current = null;
        confetti();
        break;
      } else if (json?.status === "failed") {
        setIsMinted(false);
        setIsFailed(true);
        mintingStatus.current = null;
        break;
      }

      await sleep(1000);
    }
  };

  const claim = async () => {
    try {
      const response = await fetch("/api/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId: contractMetadata?.id }),
      });
      const json = await response.json();
      if (!response.ok || response.status !== 200) {
        throw new Error(json);
      }
      const queueId = json?.queueId;
      if (!queueId) {
        throw new Error("Missing queueId");
      }
      return getMintedStatus(queueId);
    } catch (error) {
      setIsFailed(true);
    }
  };

  if (isLoading) {
    return (
      <main>
        <Head>
          <title>Your Digital Keepsake - UvA EB Challenge</title>
        </Head>
        <div className={styles.mintInfoContainer}>
          <p>Loading...</p>
        </div>
      </main>
    );
  }

  return (
    <main>
      <Head>
        <title>Your Digital Keepsake - UvA EB Challenge</title>
      </Head>
      {/* <button onClick={() => getStatus("ff5566d1-24e9-4d98-8952-daf5f428ccef")}>
        get status
      </button> */}
      <div className={styles.mintInfoContainer}>
        {isLoading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className={`${styles.infoSide} order-3 md:order-1`}>
              <ImageSlider
                items={balance?.toNumber() ?? 0 > 0 ? images : openerImage}
                showPlayButton={balance?.toNumber() ?? 0 > 0 ? true : false}
                showFullscreenButton={
                  balance?.toNumber() ?? 0 > 0 ? true : false
                }
              />
            </div>
            <div className='h-full w-full md:w-1/4 mb-2 md:mb-0 order-1 md:order-2'>
              {/* Title of your NFT Collection */}
              <h1 className='ml-[5%] md:ml-0'>{contractMetadata?.name}</h1>
              {/* Description of your NFT Collection */}
              <p className={`${styles.description} ml-[5%] md:ml-0`}>
                Your Digital Keepsake
              </p>
            </div>

            <div className={`${styles.imageSide} order-2 md:order-3`}>
              {/* Image Preview of NFTs */}
              <img
                className={styles.image}
                src={contractMetadata?.image!}
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
                    {isSoldOut ? (
                      <div>
                        <h2>Sold Out</h2>
                      </div>
                    ) : (
                      <div className='flex flex-col gap-4'>
                        <Web3Button
                          contractAddress={editionDrop?.getAddress() || ""}
                          // action={(cntr) => cntr.erc1155.claim(tokenId, quantity)}
                          action={claim}
                          isDisabled={
                            !canClaim ||
                            buttonLoading ||
                            !user?.isLoggedIn ||
                            (balance?.toNumber() ?? 0) > 0
                          }
                        >
                          {buttonLoading ? "Loading..." : buttonText}
                        </Web3Button>
                        {isFailed && (
                          <div
                            className='p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400'
                            role='alert'
                          >
                            <span className='font-medium'>
                              Minting failed. Please try again.
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
};

export default Home;
