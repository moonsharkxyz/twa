import {
  BrowserRouter as Router,
  Route,
  Routes,
  BrowserRouter,
} from 'react-router-dom';
import { TonConnectButton, useTonWallet, useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import Trade from "./Trade";
import MyPositions from './MyPositions';
import OpenPosition from './OpenPosition';
import { useLayoutEffect, useState, useRef, useEffect } from 'react';
import UserContext from './UserContext';


import { TonClient, TupleBuilder } from "ton";
import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, parseTuple, Sender, SendMode, Slice, toNano } from 'ton-core';
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { MAINADDRESS } from "./consts"


import TonLogo from "../public/img/ton.png";
import BTCLogo from "../public/img/btc.png";
import ETHLogo from "../public/img/eth.png";


function App() {
  const fetching = async () => {
    const endpoint = await getHttpEndpoint({ network: "testnet" });
    let toncenter = new TonClient({ endpoint });
    let board = await toncenter.runMethod(
      Address.parse(MAINADDRESS),
      'get_boards',
    )
    let slice = board.stack.pop().cell.beginParse();
    slice.loadMaybeAddress()
    slice.loadMaybeRef()
    console.log(slice.getFreeBits())
    let board_info = await toncenter.current.runMethod(
      board.stack.readAddress(),
      'get_info',
    )
    console.log(board_info)

  }
  const rawAddress = useTonAddress(false);
  const toncenter = useRef();
  const coins = [
    {
      name: "TON",
      logo: TonLogo,
      chart: "KUCOIN:TONUSDT|1m",
      id: 4
    },
    {
      name: "ETH",
      logo: ETHLogo,
      chart: "BINANCE:ETHUSDT|1m",
      id: 2
    },
    {
      name: "WBTC",
      logo: BTCLogo,
      chart: "BINANCE:WBTCUSDT|1m",
      id: 1
    }
  ];
  const [chosenoption, setChosenoption] = useState();
  const [priceload, setPriceload] = useState(true);
  const [isbuy, setIsbuy] = useState(true);
  const [iscall, setIscall] = useState(true);
  const [strike, setStrike] = useState([]);
  const [balance, setBalance] = useState(0);
  const [coinprice, setCoinprice] = useState();
  const [activeCoin, setActiveCoin] = useState(0);
  const wallet = useTonWallet();
  const [apperance, setApperance] = useState(window.Telegram.WebApp.colorScheme);
  const [myHistory, setMyHistory] = useState(['trade']);
  const tonmodal = useRef(false);
  const tg = window.Telegram.WebApp;
  const fetchWalletBalance = async (wallet) => {
    try {
      const response = await fetch(`https://testnet.tonapi.io/v1/jetton/getBalances?account=` + wallet.account.address)
        .then(response => response.json());
      return response;
    } catch (error) {
      console.error(error);
    }
  };
  const goBack = (e) => {
    let y = document.querySelector('[data-tc-wallets-modal-container="true"]')
    if (y !== undefined && y !== null) {
      y.click()
      tonmodal.current = false
    } else if (tonmodal.current) {
      window.history.back();
      return;
    }
    console.log(window.history.length)
    if (window.history.length < 3) {
      tg.BackButton.hide()
    } else {
      tg.BackButton.show()
    }
  }


  const checkmodal = () => {
    if (wallet !== null && wallet !== undefined) {
      if (tonmodal.current !== true) {
        tonmodal.current = true
        window.history.pushState({ ...[myHistory, "modal"] }, "modal")
      }
      tg.BackButton.show()
    }
  }
  const getprice = async (coin) => {
    try {
      const response = await fetch('/prices/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          coin: coin
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status == true) {
          setCoinprice(data.price)
          setPriceload(false)
        }
      }
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    const interval = setInterval(() => {
      getprice(coins[activeCoin].id)
    }, 2500);

    return () => {
      clearInterval(interval);
    };
  }, [activeCoin])
  useLayoutEffect(() => {
    fetching();
    window.addEventListener('popstate', goBack);
    tg.enableClosingConfirmation()
    tg.setBackgroundColor(tg.themeParams.secondary_bg_color)
    tg.expand()
    tg.BackButton.onClick(() => { window.history.back() })
    tg.onEvent("themeChanged", () => {
      setApperance(window.Telegram.WebApp.colorScheme)
      tonConnectUI.uiOptions = {
        uiPreferences: {
          theme: window.Telegram.WebApp.colorScheme === "dark" ? "DARK" : "LIGHT",
          colorsSet: {
            ["DARK"]: {
              accent: tg.themeParams.link_color,
              background: {
                primary: tg.themeParams.bg_color,
                secondary: tg.themeParams.secondary_bg_color,
                segment: tg.themeParams.text_color
              },
              connectButton: {
                background: tg.themeParams.button_color
              },
              text: {
                primary: tg.themeParams.text_color,
                secondary: tg.themeParams.hint_color,
              }
            }
          }
        }
      };
    })


  }, [])
  return (
    <UserContext.Provider value={{ toncenter, tg, priceload, setPriceload, coinprice, wallet, isbuy, setIsbuy, iscall, setIscall, strike, setStrike, coins, activeCoin, setActiveCoin, bpstrike, bcstrike, scstrike, spstrike, fetchWalletBalance, chosenoption, setChosenoption }}>
      <header>
        <img src={'./img/logo_' + apperance + '.png'} />
        <div onClick={checkmodal} style={{ marginLeft: 'auto', width: 'fit-content' }}>
          <TonConnectButton />
        </div>
      </header>
      <main>
        <BrowserRouter>
          <Routes>
            <Route index element={<Trade />} />
            <Route path='/mypositions' element={<MyPositions />} />
            <Route path='/openposition' element={<OpenPosition />} />
          </Routes>
        </BrowserRouter>
      </main>
    </UserContext.Provider>
  );

}

export default App
