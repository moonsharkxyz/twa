import UserContext from "./UserContext";
import { useContext } from "react";
export default function MyPositions() {
    const { fetchedData, setChosenstrike, tg, priceload, setPriceload, coinprice, wallet, isLong, setIsLong, iscall, setIscall, strike, setStrike, coins, activeCoin, setActiveCoin, bpstrike, bcstrike, scstrike, spstrike, fetchWalletBalance, setChosenoption } = useContext(UserContext);
    const pos = []
    return (
        <div className="content">
            <div className="optitle">
                <div>
                    Open Positions
                </div>
            </div>
            {pos.length > 0 ?
                pos.map((d, i) =>
                    <div className="map_table" style={{ borderRadius: i == 0 ? "15px 15px 0 0" : null }}>
                        <div className="head">
                            <div className="mp_asset">Asset</div>
                            <div className="mp_option_direction">Direction</div>
                            <div className="mp_option_type">Option type</div>
                            <div className="mp_quantity">Quantity</div>
                        </div>
                        <div className="line">
                            <div>{d.asset}</div>
                            <div>{d.option_direction}</div>
                            <div>{d.option_type}</div>
                            <div>{d.quantity}</div>
                        </div>
                        <div className="head">
                            <div className="mp_strike">Strike</div>
                            <div className="mp_exp_time">Exp. time</div>
                            <div className="mp_collateral">Collateral</div>
                            <div className="mp_liq_price">Liq price</div>
                        </div>
                        <div className="line">
                            <div>{d.strike}</div>
                            <div>{d.exp_time}</div>
                            <div>{d.collateral}</div>
                            <div>{d.liq_price}</div>
                        </div>
                        <div className="close_button">
                            <div> Close</div>
                        </div>
                    </div>
                )
                : wallet == null || wallet == undefined ?
                    <div className="noposition"><p>
                        Please connect your wallet to see the list of options you have purchased.</p>
                    </div>
                    :
                    <div className="noposition"><p>
                        Unfortunately, we cannot find the history of your transactions, please make sure you have purchased at least one option.</p>
                    </div>
            }
        </div>
    )
}
