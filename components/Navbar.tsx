/* eslint-disable @next/next/no-img-element */
import { ConnectWallet, darkTheme } from "@thirdweb-dev/react";
import Image from "next/image";

export default function Navbar() {
  return (
    <header className='px-4'>
      <div className='flex justify-between items-center py-0 h-20 my-2 mx-auto mb-0 border-[#1c1e21] rounded-lg px-4 border-b-gray-300 bg-[#3B637C]'>
        <div className='flex flex-row text-white justify-start'>
          <Image
            src='/images/logo/metamare-logo.jpg'
            alt='Metamare Logo'
            height='60'
            width='60'
          />
        </div>
        <ConnectWallet
          theme={darkTheme({
            colors: {
              accentText: "#3B637C",
              accentButtonBg: "#3B637C",
              primaryButtonBg: "#fff",
              accentButtonText: "#fff",
              primaryButtonText: "#000",
            },
          })}
          btnTitle='Login'
          modalTitle={"Choose a Login Method"}
          modalTitleIconUrl={""}
          switchToActiveChain={true}
          modalSize={"compact"}
        />
      </div>
      <div className='mt-4 block text-center mx-auto'>
        <img
          className='inline-block h-[60px] mr-4'
          src='/images/logo/uva-logo.png'
          alt='University of Amsterdam Logo'
        />
        <img
          className='inline-block h-[60px] mr-4'
          src='/images/logo/heineken-logo.png'
          alt='Heineken Logo'
        />
        <img
          className='inline-block h-[60px]'
          src='/images/logo/postnl-logo.png'
          alt='Post NL Logo'
        />
      </div>
    </header>
  );
}
