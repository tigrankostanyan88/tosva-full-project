import React, { useState, useEffect, useRef } from "react";
import "../Styles/Header.css";

const slideImages = [
  { id: 1, src: "/Images/slide1.jpg", alt: "TOSVA" },
  { id: 2, src: "/Images/slide2.jpg", alt: "TOSVA" },
  { id: 3, src: "/Images/slide3.jpg", alt: "TOSVA" },
];

const Header = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const touchStartX = useRef(null);
  
    // ⏱ Auto slide
    useEffect(() => {
      const timer = setInterval(() => {
        handleNextSlide();
      }, 3000);
      return () => clearInterval(timer);
    }, [currentSlide]);
  
    const handleNextSlide = () => {
      setCurrentSlide((prev) => (prev + 1) % slideImages.length);
    };
  
    const handlePrevSlide = () => {
      setCurrentSlide((prev) => (prev - 1 + slideImages.length) % slideImages.length);
    };
  
    // 📱 Touch gestures
    const handleTouchStart = (e) => {
      touchStartX.current = e.touches[0].clientX;
    };
  
    const handleTouchEnd = (e) => {
      if (!touchStartX.current) return;
      const diff = touchStartX.current - e.changedTouches[0].clientX;
      if (diff > 50) handleNextSlide();
      if (diff < -50) handlePrevSlide();
      touchStartX.current = null;
    };
  
    return (
      <header
        className="headerContainer"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="sliderTrack"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slideImages.map((slide) => (
            <div className="sliderItem" key={slide.id}>
              <img src={slide.src} alt={slide.alt} className="slideImage" />
            </div>
          ))}
        </div>
      </header>
    );
  };  


export default Header;