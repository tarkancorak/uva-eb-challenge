import React from "react";
import ImageGallery, { ReactImageGalleryProps } from "react-image-gallery";
import "react-image-gallery/styles/css/image-gallery.css";

const ImageSlider: React.FC<ReactImageGalleryProps> = ({
  items,
  showPlayButton,
  showFullscreenButton,
}) => {
  return (
    <ImageGallery
      items={items}
      autoPlay={false}
      showThumbnails={false}
      showPlayButton={showPlayButton}
      showFullscreenButton={showFullscreenButton}
    />
  );
};

export default ImageSlider;
