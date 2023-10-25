// Datafeed implementation
import Datafeed from '/cockpit/tvchart/src/datafeed.js';

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
    library_path: '/cockpit/tvchart/charting_library/',
    theme: 'dark',
    custom_css_url: '/cockpit/tvchart/src/main.css',
    locale: 'en',
    enabled_features: [
        "right_bar_stays_on_scroll",
        "minimalistic_logo",
        "narrow_chart_enabled",
        "header_saveload",
        "header_widget_dom_node",
        "header_screenshot",
        "show_logo_on_all_charts",
        "study_templates",
        "move_logo_to_main_pane",
        "show_symbol_logos",
        "show_exchange_logos",
        "create_volume_indicator_by_default"
    ],
    overrides: {
        "theme": "#1A1C1E",
        "paneProperties.background": "#1A1C1E",
        "scalesProperties.textColor": "#fff",
        "headerProperties.background": "#1A1C1E"
    },

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

// Forçar a adição do indicador de volume
//    window.tvWidget.chart().createStudy('Volume', false, true);
    
});
