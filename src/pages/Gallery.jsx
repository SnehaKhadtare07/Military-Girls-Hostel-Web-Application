import React, { useState, useEffect } from "react";

const Gallery = () => {
  const images = [
    "/gallery/img1.jpg",
    "/gallery/img2.jpg",
    "/gallery/img3.jpg",
    "/gallery/img4.jpg",
    "/gallery/img5.jpg",
    "/gallery/img6.jpg",
    "/gallery/img7.jpg",
    "/gallery/img8.jpg",
    "/gallery/img9.jpg",
    "/gallery/img10.jpg",
    "/gallery/img11.jpg",
    "/gallery/img12.jpg",
    "/gallery/img13.jpg",
    "/gallery/img14.jpg",
    "/gallery/img15.jpg",
    "/gallery/img16.jpg",
    "/gallery/img17.jpg",
    "/gallery/img18.jpg",
    "/gallery/img19.jpg",
    "/gallery/img20.jpg",
    "/gallery/img21.jpg",
    "/gallery/img22.jpg",
    "/gallery/img23.jpg",
    "/gallery/img24.jpg",
    "/gallery/img25.jpg",
    "/gallery/img26.jpg",
    "/gallery/img27.jpg",
    "/gallery/img28.jpg",
    "/gallery/img29.jpg",
    "/gallery/img30.jpg",
  ];

  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    document.body.style.overflow = selectedIndex !== null ? "hidden" : "auto";
  }, [selectedIndex]);

  const handlePrev = () => {
    setSelectedIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNext = () => {
    setSelectedIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <div className="pt-20 bg-green-200 min-h-screen">
      {/* 🌈 Animated Rainbow-Green Title */}
      <h1
        className="text-4xl sm:text-5xl font-extrabold text-center mb-8 
                   bg-gradient-to-r from-green-400 via-lime-500 via-yellow-400 via-green-600 to-green-400 
                   bg-[length:200%_auto] text-transparent bg-clip-text animate-gradient"
      >
        Welcome to Gallery
      </h1>

      {/* Responsive Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 px-3 sm:px-4 pb-10">
        {images.map((src, index) => (
          <img
            key={index}
            src={src}
            alt={`Gallery ${index}`}
            className="w-full h-48 sm:h-64 object-cover rounded-xl cursor-pointer 
                       hover:opacity-80 hover:scale-[1.02] transition-all duration-200"
            onClick={() => setSelectedIndex(index)}
          />
        ))}
      </div>

      {/* Modal Popup */}
      {selectedIndex !== null && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-[9999]">
          <div
            className="bg-[#d8f3dc] p-4 rounded-2xl shadow-2xl relative 
                       w-[90%] max-w-4xl h-[75vh] flex flex-col 
                       items-center justify-center animate-fadeIn overflow-hidden"
          >
            {/* ✕ Close Button */}
            <button
              className="absolute top-3 right-4 text-4xl font-extrabold text-gray-700 
                         hover:text-red-600 hover:scale-125 active:scale-95 transition-all duration-200"
              onClick={() => setSelectedIndex(null)}
              aria-label="Close"
            >
              ✕
            </button>

            {/* Fixed Prev / Next Buttons */}
            <button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 px-4 py-2 
                         bg-white/90 rounded-lg shadow hover:bg-gray-100 hover:scale-110 
                         active:scale-95 transition-all duration-200"
            >
              ◀
            </button>

            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 px-4 py-2 
                         bg-white/90 rounded-lg shadow hover:bg-gray-100 hover:scale-110 
                         active:scale-95 transition-all duration-200"
            >
              ▶
            </button>

            {/* Selected Image */}
            <div className="flex items-center justify-center h-full w-full">
              <img
                src={images[selectedIndex]}
                alt="Selected"
                className="max-h-[90%] max-w-[90%] object-contain rounded-lg transition-transform duration-300 ease-in-out hover:scale-105"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Gallery;
