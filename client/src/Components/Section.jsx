import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../Styles/Section.css";

const coins = [
  "BTCUSDT",
  "ETHUSDT",
  "SOLUSDT",
  "XRPUSDT",
  "ADAUSDT",
  "DOGEUSDT",
  "TONUSDT",
];

const Section = () => {
  const [cryptoData, setCryptoData] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const sliderRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const responses = await Promise.all(
          coins.map((symbol) =>
            axios.get("https://api.binance.com/api/v3/klines", {
              params: {
                symbol: symbol,
                interval: "1h",
                limit: 50,
              },
            })
          )
        );

        const formatted = responses.map((res, index) => {
          const candle = res.data;
          return {
            id: coins[index],
            name: coins[index].replace("USDT", ""),
            price: Number(candle[candle.length - 1][4]),
            sparkline: candle.map((c) => Number(c[4])),
          };
        });

        setCryptoData(formatted);
      } catch (err) {
        console.error("Crypto fetch error:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  // 🔄 Auto slider
  useEffect(() => {
    if (cryptoData.length === 0) return;
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % cryptoData.length);
    }, 3000);
    return () => clearInterval(slideInterval);
  }, [cryptoData]);

  return (
    <section className="sectionContainer">
      <div className="sectionHeader">
        <h2 className="sectionTitle">Crypto Tracker</h2>
      </div>

      <div className="sliderWrapper" ref={sliderRef}>
        <div
          className="sliderTrack"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {cryptoData.map((coin) => (
            <div className="slideItem" key={coin.id}>
              <div className="coinCard">
                <h3 className="coinName">{coin.name}</h3>
                <p className="coinPrice">${coin.price.toLocaleString()}</p>

                <div className="miniChart">
                  <svg width="100%">
                    {coin.sparkline &&
                      coin.sparkline.map((value, i, arr) => {
                        if (i === 0) return null;
                        const prev = arr[i - 1];
                        const x1 = ((i - 1) / arr.length) * 100 + "%";
                        const x2 = (i / arr.length) * 100 + "%";
                        const max = Math.max(...arr);
                        const min = Math.min(...arr);
                        const y1 = 60 - ((prev - min) / (max - min)) * 60;
                        const y2 = 60 - ((value - min) / (max - min)) * 60;

                        return (
                          <line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={value >= prev ? "#4caf50" : "#f44336"}
                            strokeWidth="2"
                          />
                        );
                      })}
                  </svg>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dots">
        {cryptoData.map((_, index) => (
          <span
            key={index}
            className={`dot ${index === currentSlide ? "active" : ""}`}
            onClick={() => setCurrentSlide(index)}
          ></span>
        ))}
      </div>
    </section>
  );
};

export default Section;