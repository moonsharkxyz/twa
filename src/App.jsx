import {
  BrowserRouter as Router,
  Route,
  Routes,
  BrowserRouter,
} from 'react-router-dom';
import { TonConnectButton, useTonWallet, useTonConnectUI, useTonAddress } from "@tonconnect/ui-react";
import TonWeb from "tonweb";
import Trade from "./Trade";
import MyPositions from './MyPositions';
import OpenPosition from './OpenPosition';
import { useLayoutEffect, useState, useRef, useEffect } from 'react';
import UserContext from './UserContext';
import { JettonWallet, TonClient, TupleBuilder } from "ton";
import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, parseTuple, Sender, SendMode, Slice, toNano } from 'ton-core';
import { getHttpEndpoint } from "@orbs-network/ton-access";
import { MAINADDRESS, JETTONWALLET } from "./consts"
import TonLogo from "../public/img/ton.png";
import BTCLogo from "../public/img/btc.png";
import ETHLogo from "../public/img/eth.png";


function App() {
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

  const [board, setBoard] = useState(null);
  const [userJettonWallet,setUserJettonWallet] = useState("")
  const [balance,setBalance] = useState("")
  const [tonConnectUI, setTonConnectUI] = useTonConnectUI()
  const [fetchedData, setFetchedData] = useState([]);
  const toncenter = useRef();
  const [chosenstrike, setChosenstrike] = useState();
  const [chosenoption, setChosenoption] = useState();
  const [priceload, setPriceload] = useState(true);
  const [boardload, setBoardload] = useState(true);
  const [isLong, setIsLong] = useState(true);
  const [iscall, setIscall] = useState(true);
  const [strike, setStrike] = useState([]);
  const [coinprice, setCoinprice] = useState(0);
  const [activeCoin, setActiveCoin] = useState(0);
  const wallet = useTonWallet();
  const [apperance, setApperance] = useState(window.Telegram.WebApp.colorScheme);
  const [myHistory, setMyHistory] = useState(['trade']);
  const tonmodal = useRef(false);
  const tg = window.Telegram.WebApp;

  const openpos = async (quantity, collateral, totalCost) => {
    totalCost = parseInt(totalCost * 100)
    quantity = parseInt(quantity * 100)
    collateral = parseInt(collateral * 100)

    if(!isLong) {
      if (collateral * 100000 <= price * quantity || price * quantity <= collateral * 1000) {
        return
      }
    }



    await tonConnectUI.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 60,
      from: wallet.account.address,
      messages: [
        {
          address: userJettonWallet,
          amount: '275000000',
          payload: beginCell()
          .storeUint(0xf8a7ea5, 32)
          .storeUint(0, 64)
          .storeCoins(Math.max(totalCost, collateral))
          .storeAddress(Address.parse(MAINADDRESS))
          .storeAddress(Address.parse(wallet.account.address))
          .storeBit(false)
          .storeCoins(200000000)
          .storeBit(false)
          .storeUint(coins[activeCoin].id, 3)
          .storeUint(board.exp_time, 64)
          .storeUint(chosenstrike, 64)
          .storeUint(iscall, 1)
          .storeUint(isLong, 1)
          .storeUint(quantity, 64)
          .storeUint(collateral, 64)
          .endCell().toBoc()
          .toString('base64')
        }
      ]
    }, {
      modals: ['before', 'error'],
      notifications: ['success'],
    })
    
  }

  function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  const layer2 = async (a) => {
    let is_live = 0
    let skew = 0
    let exp_price = 0
    let strike = 0
    try {
      let res_s = await toncenter.current.runMethod(a, 'get_info');
      let strike_info = res_s.stack;
      is_live = strike_info.readNumber();
      strike = strike_info.readNumber();
      skew = strike_info.readNumber();
      exp_price = strike_info.readNumber();
    } catch (e) {
      await delay(2500);
      return (await layer2(a))
    }
    return ({ is_live, strike, skew, exp_price })
  }
  const layer1 = async (board_addr) => {
    let is_live = 0
    let asset = 0
    let exp_time = 0
    let iv = 0
    let strikes = []
    try {
      let res_b = await toncenter.current.runMethod(board_addr, 'get_info');
      let board_info = res_b.stack;

      is_live = board_info.readNumber();
      asset = board_info.readNumber();
      exp_time = board_info.readNumber();
      iv = board_info.readNumber();

      let strike_c = res_b.stack.readCellOpt()
      let refs = strike_c.refs;
      let strikes_a = [];
      while (refs.length > 0) {
        strikes_a.push(strike_c.beginParse().loadMaybeAddress());
        strike_c = refs[0];
        refs = strike_c.refs;
      }
      strikes = await Promise.all(strikes_a.map(layer2));
    } catch (e) {
      await delay(2500);
      let ba = await layer1(board_addr)
      return (ba)
    }
    return ({ is_live, asset, exp_time, iv, strikes })
  }
  const fetchBoards = async () => {
    let endpoint = await getHttpEndpoint({ network: "testnet" });
    toncenter.current = new TonClient({ endpoint });
    let res = await toncenter.current.runMethod(Address.parse(MAINADDRESS), 'get_live_boards');

    let board = res.stack.readCell();
    let refs = board.refs;

    let b_addr_list = [];
    let adrstr = [];
    while (refs.length > 0) {
      let adr = board.beginParse().loadMaybeAddress();
      let as = adr.toString();
      if (!adrstr.includes(as)) {
        adrstr.push(as);
        b_addr_list.push(adr);
      }
      board = refs[0];
      refs = board.refs;
    }
    console.log(adrstr)
    let final_arr = await Promise.all(b_addr_list.map(layer1))
    setFetchedData(final_arr)
    console.log('1',final_arr)
  }
  const fetchWalletBalance = async (wallet) => {
    try {
      const response = await fetch(`https://testnet.tonapi.io/v1/jetton/getBalances?account=` + wallet.account.address)
        .then(response => response.json()).then(response => {
          let r = response.balances.filter(({ jetton_address }) => jetton_address === JETTONWALLET)[0]
          setUserJettonWallet(r.wallet_address.address)
          setBalance(parseInt(r.balance.slice(0, -7)) / 100)
      });
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
    }
  };

  useEffect(() => {
    if (wallet !== null && wallet !== undefined) {
        fetchWalletBalance(wallet);
    }
  }, [wallet])
  useEffect(() => {
    const interval = setInterval(() => {
      getprice(coins[activeCoin].id)
    }, 2500);
    return () => {
      clearInterval(interval);
    };
  }, [activeCoin])

  useLayoutEffect(() => {
    fetchBoards();
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
    <UserContext.Provider value={{ board, setBoard, balance, openpos, boardload, setBoardload, fetchedData, chosenstrike, setChosenstrike, toncenter, tg, priceload, setPriceload, coinprice, wallet, isLong, setIsLong, iscall, setIscall, strike, setStrike, coins, activeCoin, setActiveCoin, fetchWalletBalance, chosenoption, setChosenoption }}>
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
