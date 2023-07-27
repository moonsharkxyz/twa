import { useEffect, useState, useContext } from "react"
import UserContext from "./UserContext";

export default function OpenPosition() {
    const {tg, wallet, isbuy, setIsbuy, iscall, setIscall, strike, setStrike, coins, activeCoin, setActiveCoin, bpstrike, bcstrike, scstrike, spstrike, fetchWalletBalance, chosenoption } = useContext(UserContext);
    const [balance, setBalance] = useState("");
    const [ppo, setPpo] = useState(chosenoption);
    const [totalcost, setTotalcost] = useState(0);
    const [quantity, setQuantity] = useState("");
    const [opttitle, setOpttitle] = useState("");
    const inputvalue = (e) => {
        if (e.target.value.length > 0) {
            let x = e.target.value.split(",").join(".").replace(/[^0-9.]/g, "")
            let arr = x.split(".")
            if (arr.length > 1) {
                arr[0] = String(parseInt(arr[0]))
                arr[1] = arr[1].substring(0, 3)
                x = arr.join(".")
            } else if (x.length > 0) {
                x = parseInt(x)
            }
            setTotalcost(ppo * x)
            setQuantity(String(x))

        } else {
            setQuantity("")
            setTotalcost(0)
        }
    }
    const createOpt = () => {
        if (isbuy) {
            if (iscall) {
                setOpttitle("Buy " + coins[activeCoin].name + " $" + chosenoption + " Call")
            } else {
                setOpttitle("Buy " + coins[activeCoin].name + " $" + chosenoption + " Put")
            }
        } else if (iscall) {
            setOpttitle("Sell " + coins[activeCoin].name + " $" + chosenoption + " Call")
        } else {
            setOpttitle("Sell " + coins[activeCoin].name + " $" + chosenoption + " Put")
        }
        setTotalcost(0)
        setPpo(chosenoption)
        if (wallet !== null && wallet !== undefined) {
            fetchWalletBalance(wallet)
                .then(response => {
                    const bal = (response.balances.filter(({ jetton_address }) => jetton_address === "0:fd217493c25d5a48ed75282e204b822f7b1e56eb76ae45f53fd4f4b7b47f465b")[0].balance).slice(0, -7)
                    let ball = bal.slice(0, bal.length - 2) + '.' + bal.slice(bal.length - 2)
                    setBalance(ball)
                });
        }
        setPosrdy(true)
    }
    useEffect(() => {
        tg.BackButton.show()
        if (wallet !== null && wallet !== undefined) {
            fetchWalletBalance(wallet)
                .then(response => {
                    const bal = (response.balances.filter(({ jetton_address }) => jetton_address === "0:fd217493c25d5a48ed75282e204b822f7b1e56eb76ae45f53fd4f4b7b47f465b")[0].balance).slice(0, -7)
                    let ball = bal.slice(0, bal.length - 2) + '.' + bal.slice(bal.length - 2)
                    setBalance(ball)
                });
        }

    }, [wallet])
    return (
        <div className="content">
            <div className="optitle">
                <div>
                    BUY TON $1.7 CALL
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
                    $0.331
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
                <div className={wallet !== null & wallet !== undefined && balance > 0 && balance >= totalcost ? "buton_enable" : "buton_disable"}>
                    Open position
                </div>
            </div>
        </div>
    )
}
