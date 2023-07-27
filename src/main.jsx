import React from 'react'
import ReactDOM from 'react-dom/client'
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import App from './App.jsx'
import './index.css'


ReactDOM.createRoot(document.getElementById('root')).render(
  <TonConnectUIProvider uiPreferences={{
            theme: window.Telegram.WebApp.colorScheme === "dark" ? "DARK" : "LIGHT",
            colorsSet: {
                [window.Telegram.WebApp.colorScheme === "dark" ? "DARK" : "LIGHT"]: {
                    accent: window.Telegram.WebApp.themeParams.button_color,
                    background: {
                        primary: window.Telegram.WebApp.themeParams.bg_color,
                        secondary: window.Telegram.WebApp.themeParams.secondary_bg_color,
                        segment: window.Telegram.WebApp.themeParams.secondary_bg_color 
                    },
                    connectButton: {
                        background: window.Telegram.WebApp.themeParams.button_color
                    },
                    text: {
                        primary:  window.Telegram.WebApp.themeParams.text_color,
                        secondary:  window.Telegram.WebApp.themeParams.hint_color,
                    }
                }
            }
  }} manifestUrl="https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json">
      <App />
  </TonConnectUIProvider>,
)
