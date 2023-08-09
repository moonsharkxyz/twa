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
            id: 4, 
            decemals: 4
        },
        {
            name: "ETH",
            logo: ETHLogo,
            chart: "BINANCE:ETHUSDT|1m",
            id: 2,
            decemals: 2
        },
        {
            name: "WBTC",
            logo: BTCLogo,
            chart: "BINANCE:WBTCUSDT|1m",
            id: 1,
            decemals: 1
        }
    ];
    
    const [chosenDate, choseDate] = useState(-1);
    const [userJettonWallet, setUserJettonWallet] = useState("");
    const [board, setBoard] = useState(null);
    const [balance, setBalance] = useState("")
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
    const activeCoinIdRef = useRef(4);
    const wallet = useTonWallet();
    const [apperance, setApperance] = useState(window.Telegram.WebApp.colorScheme);
    const [myHistory, setMyHistory] = useState(['trade']);
    const tonmodal = useRef(false);
    const [positionOpened, setPositionOpened] = useState(false);
    const [positionsLoading, setPositionsLoading] = useState(false)
    const [userAddress, setUserAddress] = useState(null)
    const [nextOptionID, setNextOptionID] = useState(-1)
    const [lastFetchedOptionID, setLastFetchedOptionID] = useState(-1)
    const [fetchedOptions, setFetchedOptions] = useState([])
    const tg = window.Telegram.WebApp;
    
    const humanDate = (x) =>{
        let mounths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let z = new Date(x * 1000);
        return (z.getDate() + " " + mounths[z.getMonth()] + ", " + (z.getHours() > 12 ? (z.getHours() - 12) + " PM" : z.getHours() == 0 ? "12 PM" : z.getHours() + " AM"))
    }    
    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    const max = (x, y) => {
        return x > y ? x : y
    }
    const getUserAddr = async (wallet_addr) => {
        try {
            let args = new TupleBuilder();
            args.writeAddress(Address.parse(wallet_addr))
            let res = await toncenter.current.runMethod(
                Address.parse(MAINADDRESS),
                'get_user_address',
                args.build()
            );
            return res.stack.readAddress();
        } catch {
            await delay(2500)
            return (await getUserAddr(wallet_addr));
        }
    }
    const getNextOptionID = async (user_addr) => {
        try {
            let res = await toncenter.current.callGetMethodWithError(
                user_addr,
                'get_info'
            );
            if (res.exit_code == 0 || res.exit_code == 1) {
                return res.stack.readNumber();
            } else if (res.exit_code != -13) {
                console.log(res.exit_code)
                await delay(2500);
                return (await getNextOptionID(user_addr));
            }
        } catch (e) {
            console.log(e)
            await delay(2500);
            return (await getNextOptionID(user_addr));
        }
    }
    const getPosAddr = async (user_addr, index) => {
        try {
            let args = new TupleBuilder();
            args.writeNumber(index)
            let res = await toncenter.current.runMethod(
                user_addr,
                'get_position_address',
                args.build()
            );
            return (res.stack.readAddress())
        } catch (e) {
            console.log(e)
            await delay(2500);
            return (await getPosAddr(user_addr, index));
        }
    }
    const getPosInfo = async (pos_addr) => {
        try {
            let res = await toncenter.current.runMethod(
                pos_addr,
                'get_info'
            );
            let pos_info = res.stack.readCell().beginParse();
            let index = pos_info.loadUint(64);
            let is_closed = pos_info.loadBit();
            let asset = pos_info.loadUint(3);
            let exp_time = pos_info.loadUint(64);
            let strike = pos_info.loadUint(64);
            let is_call = pos_info.loadBit();
            let is_long = pos_info.loadBit();
            let qty = pos_info.loadUint(64);
            let collateral = pos_info.loadUint(64);
            let liq_price = pos_info.loadUint(64);

            return ({pos_addr, index, is_closed, asset, exp_time, strike, is_call, is_long, qty, collateral, liq_price })
        } catch (e) {
            console.log(e)
            await delay(2500);
            return (await getPosInfo(pos_addr));
        }
    }
    const getPosArr = async (user_addr, x, y) => {
        let positions_array = [];
        for (let i = x; i >= y; i--) {
            positions_array.push(await getPosAddr(user_addr, i))
        }
        return (await Promise.all(positions_array.map(getPosInfo)));
    }
    const fetchOptions = async () => {
        setPositionsLoading(true)
        let user_addr = await getUserAddr(wallet.account.address);

        let nextIndex = await getNextOptionID(user_addr);

        let positions_array = await getPosArr(user_addr, nextIndex - 1, max(nextIndex - 10, 0));
        setFetchedOptions(positions_array)
        setUserAddress(user_addr)
        setNextOptionID(nextIndex)
        setLastFetchedOptionID(max(nextIndex - 10, 0))
        setPositionsLoading(false)
    }

    const getStrike = async (a) => {
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
            return (await getStrike(a))
        }
        return ({ is_live, strike, skew, exp_price })
    }
    const getBoard = async (board_addr) => {
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
            strikes = await Promise.all(strikes_a.map(getStrike));
        } catch (e) {
            await delay(2500);
            return (await getBoard(board_addr))
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
        let final_arr = await Promise.all(b_addr_list.map(getBoard))
        setFetchedData(final_arr)
    }
    const fetchWalletBalance = async () => {
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

    const goBack = () => {
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
            const response = await fetch('https://twa.moonshark.xyz/prices/', {
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
                    if (activeCoinIdRef.current == coin){
                        setCoinprice(data.price)
                        setPriceload(false)
                    }
                }
            }
        } catch (error) {
        }
    };

    useEffect(() => {
        if (wallet !== null && wallet !== undefined) {
            fetchWalletBalance();
            fetchOptions();
        }
    }, [wallet])
    useEffect(() => {
        setPriceload(true);
        activeCoinIdRef.current = coins[activeCoin].id
        const interval = setInterval(() => {
            getprice(coins[activeCoin].id);
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
        <UserContext.Provider value={{ chosenDate, choseDate, delay, getUserAddr, humanDate, positionOpened, setPositionOpened, max, userAddress, userJettonWallet, setLastFetchedOptionID, lastFetchedOptionID, nextOptionID, setNextOptionID, fetchedOptions, setPositionsLoading, getPosArr, positionsLoading, setFetchedOptions, getNextOptionID, board, setBoard, balance, boardload, setBoardload, fetchedData, chosenstrike, setChosenstrike, toncenter, tg, priceload, setPriceload, coinprice, wallet, isLong, setIsLong, iscall, setIscall, strike, setStrike, coins, activeCoin, setActiveCoin, fetchWalletBalance, chosenoption, setChosenoption }}>
            <header>
                <img src={'./img/logo_' + apperance + '.png'} />
                <div onClick={checkmodal} style={{ marginLeft: 'auto', width: 'fit-content' }}>
                    <TonConnectButton />
                </div>
            </header>
                <BrowserRouter>
                    <Routes>
                        <Route index element={<Trade />} />
                        <Route path='/mypositions' element={<MyPositions />} />
                        <Route path='/openposition' element={<OpenPosition />} />
                    </Routes>
                </BrowserRouter>
        </UserContext.Provider>
    );

}

export default App
