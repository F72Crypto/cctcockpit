// Datafeed implementation
import Datafeed from '/src/datafeed.js';
import { readConfig } from './featuresets.js';

let config = {};

readConfig().then((data) => {
    config = data;

    window.tvWidget = new TradingView.widget({
        charting_library_debug_mode: true,
        symbol: 'Binance:BTC/USDT',
        interval: '1D',
        symbol_search_request_delay: 500,
        fullscreen: true,
        container: 'tv_chart_container',
        chartsStorageUrl: 'https://saveload.tradingview.com',
        chartsStorageApiVersion: '1.1',
        clientId: 'tradingview.com',
        userId: 'public_user_id',
        autosize: true,
        studiesOverrides: {},
        datafeed: Datafeed,
        library_path: '/charting_library/',
        theme: 'dark',
        custom_css_url: '/src/main.css',
        locale: 'en',
        enabled_features: config.enabled_features,
        disabled_features: config.disabled_features,
        custom_indicators_getter: function (PineJS) {
            return Promise.resolve([]);
        }
    });

    function showNotification() {
        const bodyContent = `F!72 7x1 Indicadores (RSI Tracker)
    F!72 10MAs Multi-Timeframe
    F!72 RSI + PriceCalc + Diverg.
    F!72 SuperTrade (VIP)
    F!72 MarketMonitor (VIP)
        `;
        window.tvWidget.showNoticeDialog({
            title: 'F!72 Indicadores',
            body: bodyContent,
            callback: () => {
                console.log('Noticed!');
            },
        });
    }

    window.tvWidget.onChartReady(() => {
        window.tvWidget.headerReady().then(() => {
            const button = window.tvWidget.createButton();
            button.setAttribute('title', 'Abra aqui nossos indicadores');
            button.classList.add('apply-common-tooltip');
            button.addEventListener('click', showNotification);
            button.innerHTML = 'F!72 Indicadores';
        });
    });

    window.TradingView.onready(() => {
        const widget = window.tvWidget;
        widget.onChartReady(() => {
            console.log('Chart has loaded!')
        });
    });
});
