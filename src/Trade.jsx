import { useEffect, useState, useLayoutEffect, useRef, useContext } from "react";
import { Link } from "react-router-dom";
import LoadingSpinner from "./Spinner/Spinner";
import Widget from "./Widget";
import UserContext from "./UserContext";

export default function Trade() {
    const { tg, priceload, setPriceload, coinprice, wallet, isbuy, setIsbuy, iscall, setIscall, strike, setStrike, coins, activeCoin, setActiveCoin, bpstrike, bcstrike, scstrike, spstrike, fetchWalletBalance, setChosenoption } = useContext(UserContext);
    const [isdateselect, setIsdateselect] = useState(false);
    const [chosenDate, choseDate] = useState(0);
    const [data, setData] = useState([]);
    const [isGraph, setIsGraph] = useState(false);
    const [textcolor, setTextcolor] = useState(false);
    const [shadowcolor, setShadowcolor] = useState(false);
    const [buttontextcolor, setButtontextcolor] = useState(false);
    const [coinmenu, setCoinmenu] = useState(false);
    useLayoutEffect(() => {
        selectMenuRef.current.addEventListener('wheel', transformScroll, { passive: false });
        let bodyStyles = window.getComputedStyle(document.body);
        setTextcolor(bodyStyles.getPropertyValue('--text-color'))
        setButtontextcolor(bodyStyles.getPropertyValue('--button-text-color'))
        setShadowcolor(bodyStyles.getPropertyValue('--bg-color-content'))
        window.Telegram.WebApp.onEvent("themeChanged", () => {
            let bodyStyles = window.getComputedStyle(document.body);
            setTextcolor(bodyStyles.getPropertyValue('--text-color'))
        })
        //setStrike()
        let x = 1690794000;
        let dat = [];
        let mounths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        for (let i = 0; i < 4; i++) {
            let z = new Date(x * 1000 + (604800000 * (i + 1)));
            dat[i] = z.getDate() + " " + mounths[z.getMonth()] + ", " + (z.getHours() > 12 ? (z.getHours() - 12) + " PM" : z.getHours() == 0 ? "12 PM" : z.getHours() + " AM");
        }
        setData([...dat])
    }, [])

    const backbutton = () =>{
        if (tg.BackButton.isVisible === true) {
            tg.BackButton.hide()
            console.log(tg.BackButton.isVisible)
        }
    } 
    useEffect(() => {
        let body = document.getElementsByTagName("body")[0];
        body.onclick = function () {
            setCoinmenu(false)
        };
    }, [])

    useEffect(() => {
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
    const selectMenuRef = useRef();

    return (
        <div className="content">
            <div style={{ marginLeft: "0.3rem", marginBottom: "3px" }}>
                <div className="coin" onClick={(e) => { e.stopPropagation(); setCoinmenu(!coinmenu) }} style={{ maxWidth: 'fit-content', backgroundColor: 'var(--bg-color-content)' }} >
                    <img src={coins[activeCoin].logo} />
                    <p>{coins[activeCoin].name}</p>
                    <div className={coinmenu ? "chevron-up" : "chevron-down"}>
                        <svg className="icon" xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 19 10" fill="none">
                            <path d="M18 9L9.50004 1L1 9" stroke={textcolor} stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" />
                        </svg>
                    </div>
                    {coinmenu ?
                        <div className="coinmenu" >
                            {
                                coins.map((c, i) =>
                                    i !== activeCoin &&
                                    <div className="coin" onClick={() => { setActiveCoin(i), setCoinmenu(!coinmenu), setPriceload(true) }}>
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
                    {priceload ? <LoadingSpinner elem="button" wwidth="34px" hheight="34px" /> : "$" + Math.round(coinprice * 100000 / 100000) / 100000}
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
            <div className="filters">
                <div className="selectors">
                    <div className="selector">
                        <div className={isbuy ? "isactive" : "inactive"} onClick={() => setIsbuy(true)}>Buy</div>
                        <div className={isbuy ? "inactive" : "isactive"} onClick={() => setIsbuy(false)}>Sell</div>
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
                            <LoadingSpinner />
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
            {strike.length > 0 ?
                strike.map((s, i) =>
                    i !== 2 ?
                        <div className="strike">
                            <div className="price1">
                                <p>${s.price} Call</p>
                            </div>
                            <div className="advancedinfo">
                                <div className="breaks">
                                    <div className="break">
                                        <p>Break Even</p>
                                        <div className="price2">
                                            ${s.price1}
                                        </div>
                                    </div>
                                    <div className="break">
                                        <p>To Break Even</p>
                                        <div className="price2">
                                            +${s.price2}
                                        </div>
                                    </div>
                                </div>
                                <div className="strike-button" onClick={() => setChosenoption(s.price3)} style={{ color: isbuy ? '#04A410' : '#DE3A3A' }}>
                                    <Link className="link" to={{ pathname: '/openposition' }}>
                                        ${s.price3}
                                    </Link>
                                </div>
                            </div>
                        </div>
                        : <div className="pricee">{coins[activeCoin].name} Price:<p>{priceload ? " " : "$" + Math.round(coinprice * 100000 / 100000) / 100000}</p></div>
                )
                : null
            }
        </div>
    );
};
