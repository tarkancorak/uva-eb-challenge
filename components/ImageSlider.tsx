import React from "react";
import ImageGallery from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

type ImageItem = {
  original: string;
  thumbnail: string;
};

type ImageSliderProps = {
  items: Array<ImageItem>;
};

const ImageSlider: React.FC<ImageSliderProps> = ({ items }) => {
  return (
    // <div className='mx-auto my-24 max-w-2xl'>
    <ImageGallery items={items} autoPlay={false} showThumbnails={false} />
    // </div>
  );
};

export default ImageSlider;
