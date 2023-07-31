import { useEffect, useState, useLayoutEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "./Spinner/Spinner";
import Widget from "./Widget";
import UserContext from "./UserContext";
import opt_price from "./opt_price"

export default function Trade() {
    const { board, setBoard, boardload, setBoardload, fetchedData, setChosenstrike, tg, priceload, setPriceload, coinprice, wallet, isLong, setIsLong, iscall, setIscall, strike, setStrike, coins, activeCoin, setActiveCoin, bpstrike, bcstrike, scstrike, spstrike, fetchWalletBalance, setChosenoption } = useContext(UserContext);
    const [isdateselect, setIsdateselect] = useState(false);
    const [chosenDate, choseDate] = useState(-1);
    const [data, setData] = useState([]);
    const [textcolor, setTextcolor] = useState(false);
    const [buttontextcolor, setButtontextcolor] = useState(false);
    const [coinmenu, setCoinmenu] = useState(false);
    const selectMenuRef = useRef();
    useEffect(() => {
        if (priceload) {
            return
        }
        let mounths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        let fd = fetchedData.filter((b) => b.asset == coins[activeCoin]?.id)
        let d = [];
        let b = null;
        let cd = chosenDate
        if (fd.length == 0) {
            setData(d)
            choseDate(-1)
            setBoard(b)
            return
        }
        d = fd.map(({ exp_time }) => exp_time).sort((a, b) => a - b).map((x) => {
            let z = new Date(x * 1000);
            return (z.getDate() + " " + mounths[z.getMonth()] + ", " + (z.getHours() > 12 ? (z.getHours() - 12) + " PM" : z.getHours() == 0 ? "12 PM" : z.getHours() + " AM"))
        })
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
        let bodyStyles = window.getComputedStyle(document.body);
        setTextcolor(bodyStyles.getPropertyValue('--text-color'))
        setButtontextcolor(bodyStyles.getPropertyValue('--button-text-color'))
        window.Telegram.WebApp.onEvent("themeChanged", () => {
            let bodyStyles = window.getComputedStyle(document.body);
            setTextcolor(bodyStyles.getPropertyValue('--text-color'))
        })
    }, [])
    const backbutton = () => {
        if (tg.BackButton.isVisible === true) {
            tg.BackButton.hide()
        }
    }
    useEffect(() => {
        let body = document.getElementsByTagName("body")[0];
        body.onclick = function () {
            setCoinmenu(false)
        };
        const timer = setTimeout(() => {
            backbutton();
        }, 1000);

        return () => clearTimeout(timer);
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
        let optPrice = Math.round(opt_price(board.exp_time, coinprice, s.strike, board.iv, s.skew, iscall, isLong) / 10000000) / 100;
        let breakEven
        if (iscall) {
            breakEven = Math.round(s.strike / 100 + optPrice * 1000) / 1000
        } else if (!iscall) {
            breakEven = Math.round(s.strike / 100 - optPrice * 1000) / 1000
        }
        let toBreakEven = Math.round((breakEven - (Math.round(coinprice / 1000) / 100)) * 100) / 100;
        return (
            <div className="strike">
                <div className="price1">
                    <p>${(Math.round(s.strike * 100000 / 100000) / 100000)} {iscall ? " Call" : " Put"}</p>
                </div>
                <div className="advancedinfo">
                    <div className="breaks">
                        <div className="break">
                            <p>Break Even</p>
                            <div className="price2">
                                ${breakEven}
                            </div>
                        </div>
                        <div className="break">
                            <p>To Break Even</p>
                            <div className="price2">
                                ${toBreakEven}
                            </div>
                        </div>
                    </div>
                    <div className="strike-button" onClick={() => { setChosenoption(optPrice); setChosenstrike(s.strike) }} style={{ color: isLong ? '#04A410' : '#DE3A3A' }}>
                        <Link className="link" to={{ pathname: '/openposition' }}>
                            ${activeCoin == 0 ? Math.round(opt_price(board.exp_time, coinprice, s.strike, board.iv, s.skew, iscall, isLong) / 100000) / 10000 : optPrice}
                        </Link>
                    </div>
                </div>
            </div>
        )
    }
    return (
        <div className="content">
            <div style={{ marginLeft: "0.3rem", marginBottom: "3px" }}>
                <div className="coin" onClick={(e) => { e.stopPropagation(); setCoinmenu(!coinmenu) }} style={{ maxWidth: 'fit-content', backgroundColor: 'var(--bg-color-content)' }} >
                    <img src={coins[activeCoin].logo} />
                    <p>{coins[activeCoin].name}</p>
                    <div className={coinmenu ? "chevron-up" : "chevron-down"}>
                        <svg className="icon" xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 19 10" fill="none">
                            <path d="M18 9L9.50004 1L1 9" stroke={textcolor} strokeWidth="1.5" strokeLinecap="round" strokeLineJoin="round" />
                        </svg>
                    </div>
                    {coinmenu ?
                        <div className="coinmenu" >
                            {
                                coins.map((c, i) =>
                                    i !== activeCoin &&
                                    <div className="coin" onClick={() => { setActiveCoin(i), setCoinmenu(!coinmenu), setPriceload(true), setBoardload(true) }}>
                                        <img src={c.logo} />
                                        <p>{c.name}</p>
                                    </div>

                                )
                            }
                        </div>
                        : null
                    }</div>
            </div>
            <div className="graph">
                <Widget coin={coins[activeCoin].chart} />
                <div className="chartprice">
                    {priceload ? <LoadingSpinner elem="button" size="34px" /> : "$" + Math.round(coinprice * 100000 / 100000) / 100000}
                </div>
            </div>
            <Link className="link" to={'/mypositions'}>
                <div className="mypositions" onClick={() => { window.Telegram.WebApp.BackButton.show() }}><p>Open Positions</p>
                    <div className="opview">
                        View
                        <div className="chevron-right">
                            <svg className="icon" xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 19 10" fill="none">
                                <path d="M18 9L9.50004 1L1 9" stroke={'var(--button-color)'} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                            </svg>
                        </div>
                    </div>
                </div>
            </Link>
            {!boardload ? <>
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
                        <div className="setdate">
                            {data.length > 0 ?
                                <><p style={{ padding: "0 6px 0 0" }}>{data[chosenDate]}</p> <div className={isdateselect ? "chevron-up" : "chevron-down"}>
                                    <svg className="icon" xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 19 10" fill="none">
                                        <path d="M18 9L9.50004 1L1 9" stroke={buttontextcolor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                </div></>
                                :
                                <LoadingSpinner elem="nbutton" size="20px" />
                            }
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
                <div className="pricee">{coins[activeCoin].name} Price:<p>{priceload ? "-" : "$" + Math.round(coinprice / 1000) / 100}</p></div>
                {board && board.strikes[1].map(strikeElem)}

            </>
                : <div className="nodata"><LoadingSpinner elem="button" size="34px" /></div>
            }

        </div>
    );
};
