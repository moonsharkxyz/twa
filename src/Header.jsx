import { TonConnectButton } from '@tonconnect/ui-react';
export default function Header () {
    return (
        <header>
        <img src={$logo}/>
            <TonConnectButton />
        </header>);
};