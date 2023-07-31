// TradingViewWidget.jsx
import React, { useEffect, useRef, memo, useState } from 'react';
import Spinner from "./Spinner/Spinner"

function TradingViewWidget({coin}) {
  const contariner = useRef();
  const linecolor = window.getComputedStyle(document.querySelector("body"), null).getPropertyValue("--button-color");
  useEffect(() => {
      const scrpt = document.createElement("script");
      scrpt.src = "https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js";
      scrpt.type = "text/javascript";
      scrpt.async = true;
      scrpt.innerHTML = `
        {
          "symbols": [
            [
              "` + coin + `"
            ]
          ],
          "chartOnly": true,
          "width": "100%",
          "height": "180",
          "border": "0",
          "locale": "en",
          "colorTheme": "dark",
          "autosize": true,
          "showVolume": false,
          "showMA": false,
          "hideDateRanges": false,
          "hideMarketStatus": false,
          "hideSymbolLogo": false,
          "scalePosition": "no",
          "scaleMode": "Normal",
          "backgroundColor": "rgba(255, 255, 255, 0)",
          "fontFamily": "-apple-system, BlinkMacSystemFont, Trebuchet MS, Roboto, Ubuntu, sans-serif",
          "fontSize": "10",
          "noTimeScale": true,
          "valuesTracking": "1",
          "changeMode": "price-and-percent",
          "chartType": "line",
          "color": "` + linecolor + `",
          "maLineWidth": 1,
          "maLength": 9,
          "lineWidth": 2,
          "lineType": 0,
          "dateRanges": [
            "1m|60",
            "3m|180",
            "12m|1D"
          ]
        }`;
        contariner.current.replaceChildren(scrpt);
  }, [coin]);
  return (
  <><div className="tradingview-widget-container" ref={contariner}></div><div className="tradingview-widget-copyright"><a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">{/* <span className="blue-text">Track all markets on TradingView</span> */}</a></div></>);
}

export default memo(TradingViewWidget);