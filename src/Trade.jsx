import { useEffect, useState, useLayoutEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "./Spinner/Spinner";
import Widget from "./Widget";
import UserContext from "./UserContext";
import opt_price from "./opt_price"

export default function Trade() {
    const { chosenDate, choseDate, humanDate, board, setBoard, boardload, setBoardload, fetchedData, setChosenstrike, tg, priceload, setPriceload, coinprice, wallet, isLong, setIsLong, iscall, setIscall, strike, setStrike, coins, activeCoin, setActiveCoin, setChosenoption } = useContext(UserContext);
    const [isdateselect, setIsdateselect] = useState(false);
    const [data, setData] = useState([]);
    const [coinmenu, setCoinmenu] = useState(false);
    const selectMenuRef = useRef();

    useEffect(() => {
        if (priceload) {
            return
        }
        let fd = fetchedData.filter((b) => b.asset == coins[activeCoin]?.id).sort((a, b) => a.exp_time - b.exp_time)
        let d = [];
        let b = null;
        let cd = chosenDate
        if (fd.length == 0) {
            setData(d)
            choseDate(-1)
            setBoard(b)
            return
        }
        d = fd.map(({ exp_time }) => exp_time).map(humanDate)

        if (d[chosenDate] == undefined) {
            cd = 0
        }
        b = { ...fd.filter((v, i) => i == cd)[0] }
        let s = [b.strikes.filter(({ strike }) => strike < coinprice).sort((a, b) => a.strike - b.strike), b.strikes.filter(({ strike }) => strike >= coinprice).sort((a, b) => a.strike - b.strike)];
        b.strikes = s
        setData(d)
        setBoard(b)
        choseDate(cd)
        setBoardload(false)
    }, [fetchedData, activeCoin, chosenDate, coinprice, priceload])
    useLayoutEffect(() => {
        if (board !== null) {
            selectMenuRef.current.addEventListener('wheel', transformScroll, { passive: false });
        }
        let body = document.getElementsByTagName("body")[0];
        body.onclick = function () {
            setCoinmenu(false)
        };
        setTimeout(tg.BackButton.hide, 1);
    }, [])

    function transformScroll(event) {
        if (!event.deltaY) {
            return;
        }
        event.currentTarget.scrollLeft += event.deltaY + event.deltaX;
        event.stopPropagation();
        event.preventDefault();
    }
    const strikeElem = (s) => {
        let optPrice = opt_price(board.exp_time, coinprice, s.strike, board.iv, s.skew, iscall, isLong) / 1000000000;
        let breakEven
        if (iscall) {
            if (coins[activeCoin].id !== 4) {
                breakEven = s.strike / 100000 + optPrice
            } else {
                breakEven = s.strike / 100000 + optPrice
            }
        } else if (!iscall) {
            if (coins[activeCoin].id !== 4) {
                breakEven = s.strike / 100000 - optPrice
            } else {
                breakEven = s.strike / 100000 - optPrice
            }
        }
        let toBreakEven = breakEven - coinprice / 100000
        return (
            <div className="strike">
                <div className="price1">
                    <p>${coins[activeCoin].id !== 4 ? (s.strike / 100000) : (s.strike / 100000).toFixed(4)} {iscall ? " Call" : " Put"}</p>
                </div>
                <div className="advancedinfo">
                    <div className="breaks">
                        <div className="break">
                            <p>Break Even</p>
                            <div className="price2">
                                ${breakEven.toFixed(coins[activeCoin].decemals)}
                            </div>
                        </div>
                        <div className="break">
                            <p>To Break Even</p>
                            <div className="price2">
                                {toBreakEven < 0 ? "-$" + toBreakEven.toFixed(coins[activeCoin].decemals) * -1 : "$" + toBreakEven.toFixed(coins[activeCoin].decemals)}
                            </div>
                        </div>
                    </div>
                    <div className="strike-button" onClick={() => { setChosenoption(optPrice); setChosenstrike(s.strike) }} style={{ color: isLong ? '#04A410' : '#DE3A3A' }}>
                        <Link className="link" to={{ pathname: '/openposition' }}>
                            ${optPrice.toFixed(coins[activeCoin].decemals)}
                        </Link>
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className="content">
            <div style={{ marginBottom: "3px" }}>
                <div className="coin" onClick={(e) => { e.stopPropagation(); setCoinmenu(!coinmenu) }} style={{ maxWidth: 'fit-content', backgroundColor: 'var(--bg-color-content)' }} >
                    <img src={coins[activeCoin].logo} />
                    <p>{coins[activeCoin].name}</p>
                    <div className={coinmenu ? "chevron-up" : "chevron-down"}>
                        <svg className="icon" xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 19 10" fill="none">
                            <path d="M18 9L9.50004 1L1 9" stroke={'var(--text-color)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    {coinmenu && <div className="coinmenu" >
                        {
                            coins.map((c, i) =>
                                i !== activeCoin &&
                                <div className="coin" onClick={() => { setActiveCoin(i); setCoinmenu(!coinmenu); setBoardload(true) }}>
                                    <img src={c.logo} />
                                    <p>{c.name}</p>
                                </div>

                            )
                        }
                    </div>}
                </div>
            </div>
            <div className="graph">
                <Widget coin={coins[activeCoin].chart} />
                <div className={priceload ? "chartpriceloading" : "chartpriceloaded"} >
                    {priceload ? <LoadingSpinner elem="var(--button-color)" size="34px" /> : "$" + (coinprice / 100000).toFixed(coins[activeCoin].decemals)}
                </div>
            </div>
            <Link className="link" to={'/mypositions'}>
                <div className="mypositions" onClick={() => { window.Telegram.WebApp.BackButton.show() }}><p>Open Positions</p>
                    <div className="opview">
                        View
                        <div className="chevron-right">
                            <svg className="icon" xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 19 10" fill="none">
                                <path d="M18 9L9.50004 1L1 9" stroke={'var(--button-color)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>
            </Link>
            {boardload || priceload || chosenDate == -1 ? <div className="nodata"><LoadingSpinner elem="var(--button-color)" size="34px" /></div> :
                <>
                    <div className="filters">
                        <div className="selectors">
                            <div className="selector">
                                <div className={isLong ? "isactive" : "inactive"} onClick={() => setIsLong(true)}>Buy</div>
                                <div className={isLong ? "inactive" : "isactive"} onClick={() => setIsLong(false)}>Sell</div>
                            </div>
                            <div className="selector">
                                <div className={iscall ? "isactive" : "inactive"} onClick={() => setIscall(true)}>Call</div>
                                <div className={iscall ? "inactive" : "isactive"} onClick={() => setIscall(false)}>Put</div>
                            </div>
                        </div>
                        <div onClick={() => { if (data.length > 0) { setIsdateselect(!isdateselect) } }}>
                            <div className="setdate"><p style={{ padding: "0 6px 0 0" }}>{data[chosenDate]}</p> <div className={isdateselect ? "chevron-up" : "chevron-down"}>
                                <svg className="icon" xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 19 10" fill="none">
                                    <path d="M18 9L9.50004 1L1 9" stroke={'var(--button-text-color)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                            </div>
                            </div>
                        </div>
                    </div>
                    <div className="transition" style={{ height: isdateselect ? '4rem' : 0, marginTop: isdateselect ? '3px' : 0 }}>
                        <div className="date-select-menu" ref={selectMenuRef} onWheel={transformScroll}>
                            {data.map((d, i) =>
                                <div className={chosenDate === i ? "active-date" : "inactive-date"} style={{ zIndex: !isdateselect ? '-1' : '1' }} onClick={() => { choseDate(i); setIsdateselect(!isdateselect) }}>{d}</div>
                            )}
                        </div>
                    </div>

                    {board && board.strikes[0].map(strikeElem)}
                    <div className="pricee">{coins[activeCoin].name} Price:<p>{priceload ? "-" : "$" + (coinprice / 100000).toFixed(coins[activeCoin].decemals)}</p></div>
                    {board && board.strikes[1].map(strikeElem)}
                </>
            }
            <div className="about">
                <a href="https://docs.moonshark.xyz" target="_blank">Any questions? Visit our <span>docs</span></a>
                <a href="https://t.me/moonshark_faucet_bot" target="_blank">Testnet jUSDT <span>faucet</span></a>
            </div>
        </div>
    );
};
