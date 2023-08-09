import { useEffect, useState, useContext, useLayoutEffect } from "react"
import { useTonConnectUI } from "@tonconnect/ui-react";
import UserContext from "./UserContext";
import { useNavigate } from 'react-router-dom'
import { Address, beginCell, Cell, Contract, contractAddress, ContractProvider, Dictionary, parseTuple, Sender, SendMode, Slice, toNano } from 'ton-core';
import { MAINADDRESS } from "./consts";

export default function OpenPosition() {
	const { humanDate, max, positionOpened, setPositionOpened, userJettonWallet, board, balance, chosenstrike, coinprice, tg, wallet, isLong, setIsLong, iscall, setIscall, strike, setStrike, coins, activeCoin, setActiveCoin, bpstrike, bcstrike, scstrike, spstrike, fetchWalletBalance, chosenoption, setPositionsLoading } = useContext(UserContext);
	const [ppo, setPpo] = useState(chosenoption);
	const [totalcost, setTotalcost] = useState(0);
	const [quantity, setQuantity] = useState("");
	const [tonConnectUI, setTonConnectUI] = useTonConnectUI();
	const [collateral, setCollateral] = useState("");
	const [opttitle, setOpttitle] = useState("");
	const navigate = useNavigate();
	useLayoutEffect(() => {
		if (chosenoption == null || chosenoption == undefined) {
			navigate("/trade")
			Telegram.WebApp.BackButton.hide();
		} else {
			createOpt()
			tg.BackButton.show()
		}
	}, [])
	const inputvalue = (e) => {
		console.log(e.target.value)
		if (e.target.value.length > 8) {
			return
		}
		let x = e.target.value.split(",").join(".").replace(/[^0-9.]/g, "")
		if (x[0] == ".") {
			x = "0" + x;
		}
		let arr = x.split(".")
		if (arr.length > 1) {
			x = String(parseInt(arr[0])) + "." + arr[1].substring(0, 2);
		} else if (x.length > 0) {
			x = String(parseInt(x))
		} else {
			setQuantity("")
			setTotalcost(0)
			return
		}
		setTotalcost((ppo * x).toFixed(coins[activeCoin].decemals))
		setQuantity(x)
	}

	const openpos = async () => {
		if (wallet == null || wallet == undefined || !(balance > 0 && coinprice !== 0) || quantity == 0 || isLong && balance < totalcost || !isLong && (collateral == 0 || !(coinprice * quantity * 0.2 < collateral * 100000 && collateral * 10000 < coinprice * quantity))) {
			console.log(coinprice, quantity, collateral)
			return
		}
		tonConnectUI.sendTransaction({
			validUntil: Math.floor(Date.now() / 1000) + 60,
			from: wallet.account.address,
			messages: [
				{
					address: userJettonWallet,
					amount: '375000000',
					payload: beginCell()
						.storeUint(0xf8a7ea5, 32)
						.storeUint(0, 64)
						.storeCoins(max(totalcost, collateral) * 1000000000)
						.storeAddress(Address.parse(MAINADDRESS))
						.storeAddress(Address.parse(wallet.account.address))
						.storeBit(false)
						.storeCoins(300000000)
						.storeUint(parseInt(coins[activeCoin].id), 3)
						.storeUint(parseInt(board.exp_time), 64)
						.storeUint(parseInt(chosenstrike), 64)
						.storeBit(iscall)
						.storeBit(isLong)
						.storeUint(parseInt(quantity * 100), 64)
						.storeUint(parseInt(collateral * 1000), 64)
						.endCell().toBoc()
						.toString('base64')
				}
			]
		}, {
			modals: ['before', 'error'],
			notifications: ['success'],
		}).then((res) => { navigate("/mypositions"); setPositionOpened(true) }).catch((e) => { console.log(e) })
	}
	const colinput = (e) => {
		console.log(e.target.value)
		if (e.target.value.length > 0) {
			let x = e.target.value.split(",").join(".").replace(/[^0-9.]/g, "")
			if (x.startsWith(".")) {
				x = "0" + x;
			}
			let arr = x.split(".")
			if (arr.length > 2) {
				arr.splice(2, 1);
			}
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
	return (
		<div className="content">
			<div className="optitle">
				<div>
					{opttitle}
				</div>
			</div>
			<div className="count">
				<div className="contracts">
					<p>Quantity</p>
					<div className="countinput">
						<input placeholder="0.0" value={quantity} onChange={inputvalue} pattern="[0-9]*" inputMode="decimal" />
					</div>
				</div>
				<div className="ppo">
					<p>Price Per Option</p>
					${chosenoption.toFixed(coins[activeCoin].decemals)}
				</div>
				{isLong ?
					<div className="maxcost">
						<p>Total Cost</p>
						${totalcost}
					</div>
					:
					<>
						<div className="maxcost">
							<p>Total Premium</p>
							${totalcost}
						</div>
						<div className="collateral">
							<p>Collateral</p>
							<div className="colinput" style={{ border: (Math.round(coinprice / 100000 * quantity * 0.2) < collateral && collateral < Math.round(coinprice / 100000 * quantity)) || quantity == 0 || collateral == 0 ? "0px solid" : "1px solid #DE3A3A" }} >
								<div className="countinput">
									<input placeholder={"" + (coinprice / 20000 * quantity ).toFixed(2) + " - " + "" + (coinprice / 100000 * quantity).toFixed(2) + ""} value={collateral} onChange={colinput} pattern="[0-9]*" inputMode="decimal" />
								</div>
								<div className="stablecoin">JUSDT</div>
							</div>
						</div>
						<div className="liqprice">
							<p>Liq price</p>
							{coinprice !== 0 && collateral !== 0 && quantity !== 0 && collateral !== "" && quantity !== "" && (coinprice / 100000 - collateral / quantity) > 0 ? "$" + (coinprice / 100000 - collateral / quantity).toFixed(coins[activeCoin].decemals) : "-"}
						</div>
					</>
				}
				<div className="userbalance" >
					<p>User Balance</p>
					{wallet !== null & wallet !== undefined && balance !== 0 ? "$" + balance : "-"}
				</div>
			</div>
			<div className="openposition">
				<div
					className={wallet == null || wallet == undefined || balance == 0 || coinprice == 0 || quantity == 0 || isLong && balance < totalcost ||
						!isLong && (collateral == 0 || !(coinprice * quantity * 0.2 < collateral * 100000 && collateral * 10000 < coinprice * quantity)) ? "buton_disable" : "buton_enable"}
					onClick={() => openpos()}>
					Open position
				</div>
			</div>
		</div>
	)
}
