import { useEffect, useState, useContext } from "react"
import { useTonWallet } from "@tonconnect/ui-react";
import UserContext from "./UserContext";

export default function OpenPosition() {
    const { board, balance, openpos, chosenstrike, coinprice, tg, wallet, isLong, setIsLong, iscall, setIscall, strike, setStrike, coins, activeCoin, setActiveCoin, bpstrike, bcstrike, scstrike, spstrike, fetchWalletBalance, chosenoption } = useContext(UserContext);
    const [ppo, setPpo] = useState(chosenoption);
    const [totalcost, setTotalcost] = useState(0);
    const [quantity, setQuantity] = useState("");
    const [collateral, setCollateral] = useState("");
    const [opttitle, setOpttitle] = useState("");
    const inputvalue = (e) => {
        if (e.target.value.length > 0) {
            let x = e.target.value.split(",").join(".").replace(/[^0-9.]/g, "")
            let arr = x.split(".")
            if (arr.length > 1) {
                arr[0] = String(parseInt(arr[0]))
                arr[1] = arr[1].substring(0, 2)
                x = arr.join(".")
            } else if (x.length > 0) {
                x = parseInt(x)
            }
            setTotalcost(Math.round(ppo * x * 1000) / 1000)
            setQuantity(String(x))

        } else {
            setQuantity("")
            setTotalcost(0)
        }
    }
    const colinput = (e) => {
        if (e.target.value.length > 0) {
            let x = e.target.value.split(",").join(".").replace(/[^0-9.]/g, "")
            let arr = x.split(".")
            if (arr.length > 1) {
                arr[0] = String(parseInt(arr[0]))
                arr[1] = arr[1].substring(0, 2)
                x = arr.join(".")
            } else if (x.length > 0) {
                x = parseInt(x)
            }
            setCollateral(String(x))

        } else {
            setCollateral("")
        }
    }
    const createOpt = () => {
        if (isLong) {
            if (iscall) {
                setOpttitle("Buy " + coins[activeCoin].name + " $" + chosenstrike / 100000 + " Call")
            } else {
                setOpttitle("Buy " + coins[activeCoin].name + " $" + chosenstrike / 100000 + " Put")
            }
        } else if (iscall) {
            setOpttitle("Sell " + coins[activeCoin].name + " $" + chosenstrike / 100000 + " Call")
        } else {
            setOpttitle("Sell " + coins[activeCoin].name + " $" + chosenstrike / 100000 + " Put")
        }
        setTotalcost(0)
        setPpo(chosenoption)
    }
    useEffect(() => {
        createOpt()
        tg.BackButton.show()
    }, [])
    return (
        <div className="content">
            {!isLong ? <>
                <div className="optitle">
                    <div>
                        {opttitle}
                    </div>
                </div>
                <div className="count">
                    <div className="contracts">
                        <p>Quantity</p>
                        <div className="countinput">
                            <input type="tel" placeholder="0.0" max="1000000" maxlength="7" value={quantity} onChange={inputvalue} />
                        </div>
                    </div>
                    <div className="ppo">
                        <p>Price Per Option</p>
                        ${chosenoption}
                    </div>
                    <div className="maxcost">
                        <p>Total Premium</p>
                        ${totalcost}
                    </div>
                    <div className="collateral">
                        <p>Collateral</p>
                        <div className="colinput" style={{ border: (Math.round(coinprice / 100000 * quantity * 0.2) < collateral && collateral < Math.round(coinprice / 100000 * quantity)) || quantity == 0 || collateral == 0 ? "0px solid" : "1px solid #DE3A3A" }} >
                            <div className="countinput">
                                <input type="tel" placeholder={"" + Math.round(coinprice / 100000 * quantity * 0.2) + " - " + "" + Math.round(coinprice / 100000 * quantity) + ""} max="1000000" maxlength="7" value={collateral} onChange={colinput} />
                            </div>
                            <div className="stablecoin">JUSDT</div>
                        </div>
                    </div>
                    <div className="liqprice">
                        <p>Liq price</p>
                        {coinprice && collateral && quantity && (Math.round(coinprice / 1000) / 100 - (collateral / quantity)) < 0 ? "-" : "$" + Math.round(Math.round(coinprice / 1000) / 100 - (collateral / quantity))}
                    </div>
                    <div className="userbalance">
                        <p>User Balance</p>
                        {wallet !== null & wallet !== undefined ? "$" + balance : "-"}
                    </div>
                </div>
                <div className="openposition">
                    <div
                        className={wallet !== null & wallet !== undefined && balance > 0 && balance >= totalcost ? "buton_enable" : "buton_disable"}
                        onClick={() => openpos(wallet, board, s, quantity, collateral, totalcost)}
                    >
                        Open position
                    </div>
                </div></>
                : <>
                    <div className="optitle">
                        <div>
                            {opttitle}
                        </div>
                    </div>
                    <div className="count">
                        <div className="contracts">
                            <p>Quantity</p>
                            <div className="countinput">
                                <input type="tel" placeholder="0.0" max="1000000" maxlength="7" value={quantity} onChange={inputvalue} />
                            </div>
                        </div>
                        <div className="ppo">
                            <p>Price Per Option</p>
                            ${chosenoption}
                        </div>
                        <div className="maxcost">
                            <p>Total Cost</p>
                            ${totalcost}
                        </div>
                        <div className="userbalance">
                            <p>User Balance</p>
                            {wallet !== null & wallet !== undefined ? "$" + balance : "-"}
                        </div>
                    </div>
                    <div className="openposition">
                        <div className={wallet !== null & wallet !== undefined && balance > 0 && balance >= totalcost ? "buton_enable" : "buton_disable"} onClick={() => openpos(quantity, collateral, totalcost)}>
                            Open position
                        </div>
                    </div></>}
        </div>
    )
}
