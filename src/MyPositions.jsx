import LoadingSpinner from "./Spinner/Spinner";
import UserContext from "./UserContext";
import { useContext, useEffect } from "react";
export default function MyPositions() {
	const { delay, getUserAddr, humanDate, max, positionOpened, setPositionOpened, userAddress, setLastFetchedOptionID, lastFetchedOptionID, nextOptionID, setNextOptionID, fetchedOptions, setPositionsLoading, getPosArr, positionsLoading, setFetchedOptions, getNextOptionID, wallet, isLong, setIsLong, iscall, setIscall, coins, activeCoin, setActiveCoin, fetchWalletBalance, setChosenoption } = useContext(UserContext);
	let i = 1;
	useEffect(() => {
		const interval = setInterval(async () => {
			if (positionsLoading) {
				return
			}
			let user_addr = userAddress
			while (user_addr == undefined || user_addr == null) {
				delay(2500)
				user_addr = await getUserAddr(wallet.account.address);
			}
			let nid = await getNextOptionID(userAddress)
			if (nid == nextOptionID) {
				return
			}
			setPositionsLoading(true)
			getPosArr(user_addr, nid - 1, nextOptionID).then((positions_array) => {
				setFetchedOptions([...positions_array, ...fetchedOptions]);
				setNextOptionID(nid);
			}).finally(() => {
				setPositionOpened(false);
				setPositionsLoading(false)
			})
		}, 2500);
		return () => {
			clearInterval(interval);
		};
	}, [userAddress, nextOptionID])
	const optionElem = ({ pos_addr, index, is_closed, asset, exp_time, strike, is_call, is_long, qty, collateral, liq_price }, i) => {
		let assetName = coins.filter((c) => c.id == asset)[0].name;
		let option_direction = is_long ? "Buy" : "Sell";
		let option_type = is_call ? "Call" : "Put";
		let quantity = qty / 100;
		strike = Math.round(strike / 1000) / 100;
		collateral = collateral / 1000000000;
		liq_price = Math.round(liq_price / 10000) / 1000;
		exp_time = humanDate(exp_time).split(",")[0]
		return (
			<div className="map_table" style={{ borderRadius: i == 0 && !positionOpened ? "15px 15px 0 0" : null }} key={index}>
				<div className="head">
					<div className="mp_asset">Asset</div>
					<div className="mp_option_direction">Direction</div>
					<div className="mp_option_type">Option type</div>
					<div className="mp_quantity">Quantity</div>
				</div>
				<div className="line">
					<div>{assetName}</div>
					<div>{option_direction}</div>
					<div>{option_type}</div>
					<div>{quantity}</div>
				</div>
				<div className="head">
					<div className="mp_strike">Strike</div>
					<div className="mp_exp_time">Exp. time</div>
					<div className="mp_collateral">Collateral</div>
					<div className="mp_liq_price">Liq price</div>
				</div>
				<div className="line">
					<div>{strike}</div>
					<div>{exp_time}</div>
					<div>{is_long ? "-" : collateral}</div>
					<div>{is_long ? "-" : liq_price}</div>
				</div>
				{is_closed ?
					<div className="close_button">
						<div>Closed</div>
					</div>
					:
					<div className="close_button">
						<div>Close</div>
					</div>
				}
			</div>
		)
	}
	const loadMorePositions = () => {
		if (positionsLoading) {
			return
		}
		setPositionsLoading(true)
		getPosArr(userAddress, lastFetchedOptionID - 1, max(lastFetchedOptionID - 10, 0)).then((arr) => {
			setFetchedOptions([...fetchedOptions, ...arr]);
			console.log(arr);
			setLastFetchedOptionID(max(lastFetchedOptionID - 10, 0))
		}).catch((e) => console.log(e)).finally(() => { setPositionsLoading(false) })
	}
	return (
		<div className="content">
			<div className="optitle">
				<div>
					Open Positions
				</div>
			</div>
			{positionOpened ?
				<div style={{ height: "fit-content", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", textAlign: 'center', backgroundColor: "var(--bg-color-content", minHeight: '5rem', color: 'var(--text-color-second', padding: "2rem", fontSize: '15px', gap: "1rem", borderRadius: "15px 15px 0 0", marginBottom: "3px" }}>
					<LoadingSpinner elem="var(--text-color-second)" size="34px" />
					<p>Your new position will be displayed here in 20-30 seconds</p>
				</div>
				:
				fetchedOptions.length == 0 ?
					positionsLoading ?
						<div className="noposition"><LoadingSpinner elem="var(--text-color-second)" size="40px" /></div>
						:
						<div className="noposition">
							<p>
								{wallet == null || wallet == undefined ? "Please connect your wallet to see the list of open positions." : "Unfortunately, we cannot find the history of your transactions, please make sure you have at least one position open."}
							</p>
						</div>
					: null
			}
			{fetchedOptions.map(optionElem)}
			{lastFetchedOptionID > 0 &&
				<div style={{ width: "100%", display: "flex", justifyContent: 'center' }}>
					<div className="showmore" style={{ color: "var(--button-color)" }}
						onClick={loadMorePositions}>
						{positionsLoading ?
							<LoadingSpinner elem="var(--button-color)" size="20px" />
							:
							<>
								Show more
								<div className={"chevron-down"}>
									<svg className="icon" xmlns="http://www.w3.org/2000/svg" width="11" height="10" viewBox="0 0 19 10" fill="none">
										<path d="M18 9L9.50004 1L1 9" stroke={'var(--button-color)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
									</svg>
								</div>
							</>
						}
					</div>
				</div>
			}
		</div>
	)
}
