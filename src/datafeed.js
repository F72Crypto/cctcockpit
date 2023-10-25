import {
	makeApiRequest,
	generateSymbol,
	parseFullSymbol,
} from '/cockpit/tvchart/src/helpers.js';
import {
	subscribeOnStream,
	unsubscribeFromStream,
} from '/cockpit/tvchart/src/streaming.js';

const lastBarsCache = new Map();

// DatafeedConfiguration implementation
const configurationData = {
	// Represents the resolutions for bars supported by your datafeed
    	supported_resolutions: ['1', '3', '5', '15', '30', '60', '120', '240', '360', '480', '720', '1D', '3D', '5D', '1W', '2W', '1M'],
	
	// The `exchanges` arguments are used for the `searchSymbols` method if a user selects the exchange
	exchanges: [{ value: 'All sources', name: 'All sources', desc: 'All sources' },
	    {
		value: 'Binance',
		name: 'Binance',
		desc: 'Binance',
	},
	{
		value: 'Bitfinex',
		name: 'Bitfinex',
		desc: 'Bitfinex',
	},	
    {
		value: 'Bybit',
		name: 'Bybit',
		desc: 'Bybit',
	},
    {
		value: 'Huobi',
		name: 'Huobi',
		desc: 'Huobi',
	},	
//	{
//		value: 'COINBASE',// Filter name
//		name: 'COINBASE',	// Full exchange name displayed in the filter popup
//		desc: 'COINBASE',
//	},

	],
	// The `symbols_types` arguments are used for the `searchSymbols` method if a user selects this symbol type
	symbols_types: [{
		name: 'CryptoCurrencies',
		value: 'crypto',
	},{
		name: 'NFTs',
		value: 'nfs',
	},{
		name: 'Tokens',
		value: 'tokens',
	},{
		name: 'StableCoins',
		value: 'stablecoins',
	},{
		name: 'DeFi',
		value: 'defi',
	},{
		name: 'AI',
		value: 'ai',
	},{
		name: 'Web3',
		value: 'Web3',
	},
	],
};

// Obtains all symbols for all exchanges supported by CryptoCompare API
async function getAllSymbols() {
    const data = await makeApiRequest('data/v3/all/exchanges');
    let allSymbols = [];

    for (const exchange of configurationData.exchanges) {
        
        if (data.Data[exchange.value]) {
            const pairs = data.Data[exchange.value].pairs;

        for (const leftPairPart of Object.keys(pairs)) {
            const symbols = pairs[leftPairPart].map(rightPairPart => {
                const symbol = generateSymbol(exchange.value, leftPairPart, rightPairPart);
                return {
                    symbol: symbol.short,
                    full_name: symbol.full,
                    description: symbol.short,
                    exchange: exchange.value,
                    exchange_logo: `https://s3-symbol-logo.tradingview.com/provider/${exchange.value.toLowerCase()}.svg`,
                    type: '',
                    logo_urls: [
                        `https://assets.coincap.io/assets/icons/${leftPairPart.toLowerCase()}@2x.png`, 
                        `https://assets.coincap.io/assets/icons/${rightPairPart.toLowerCase()}@2x.png`
                    ]
                };
            });
            allSymbols = [...allSymbols, ...symbols];
        }
    }
}

    // Sort all symbols alphabetically
    allSymbols.sort((a, b) => a.full_name.localeCompare(b.full_name));

    return allSymbols;
}


// FIM

export default {
	onReady: (callback) => {
		console.log('[onReady]: Method call');
		setTimeout(() => callback(configurationData));
	},

	searchSymbols: async (
		userInput,
		exchange,
		symbolType,
		onResultReadyCallback,
	) => {
		console.log('[searchSymbols]: Method call');
		const symbols = await getAllSymbols();
		const newSymbols = symbols.filter(symbol => {
			const isExchangeValid = exchange === 'All sources' || exchange === '' || symbol.exchange === exchange;
			const isFullSymbolContainsInput = symbol.full_name
				.toLowerCase()
				.indexOf(userInput.toLowerCase()) !== -1;
			return isExchangeValid && isFullSymbolContainsInput;
		});
		onResultReadyCallback(newSymbols);
	},

	resolveSymbol: async (
		symbolName,
		onSymbolResolvedCallback,
		onResolveErrorCallback,
		extension
	) => {
		console.log('[resolveSymbol]: Method call', symbolName);
		const symbols = await getAllSymbols();
		const symbolItem = symbols.find(({
			full_name,
		}) => full_name === symbolName);
		if (!symbolItem) {
			console.log('[resolveSymbol]: Cannot resolve symbol', symbolName);
			onResolveErrorCallback('cannot resolve symbol');
			return;
		}
		// Symbol information object
		const symbolInfo = {
			ticker: symbolItem.full_name,
			name: symbolItem.symbol,
			description: symbolItem.description,
			type: symbolItem.type,
			show_symbol_logos: true,
          	show_exchange_logos: true,
			exchange: symbolItem.exchange,
			//minmov: 1,
			pricescale: 100,
			visible_plots_set: true,
			supported_resolutions: configurationData.supported_resolutions,
			//volume_precision: 2,
			//data_status: 'streaming',
			//type: 'crypto',
			session: '24x7',
			timezone: 'Etc/UTC',
			//ticker: symbolName,
			//exchange: split_data[0],
			minmov: 1,
			//pricescale: 100000000,
			has_intraday: true,
			intraday_multipliers: ['1', '60'],
			//supported_resolution:  supportedResolutions,
			volume_precision: 8,
			data_status: 'streaming',
			symbol_search_request_delay: 1000,
            create_volume_indicator_by_default: true,			
		};

		console.log('[resolveSymbol]: Symbol resolved', symbolName);
		onSymbolResolvedCallback(symbolInfo);
	},
	

/////////////////////////////////////////////////////////////////////////
getBars: async (symbolInfo, resolution, periodParams, onHistoryCallback, onErrorCallback) => {
    console.log('[getBars]: Called with resolution', resolution)
    const { from, to, firstDataRequest } = periodParams;
    console.log('[getBars]: periodParams', periodParams);    
    console.log('[getBars]: Method call', symbolInfo, resolution, from, to);
    const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
    console.log('[getBars]: parsedSymbol', parsedSymbol);    
    const urlParameters = {
        fsym: parsedSymbol.fromSymbol,
        tsym: parsedSymbol.toSymbol,
        toTs: to,
        limit: 2000,
    };
    const query = Object.keys(urlParameters)
        .map(name => `${name}=${encodeURIComponent(urlParameters[name])}`)
        .join('&');

let urlPath;
if (resolution.includes('D') || resolution.includes('W') || resolution.includes('M')) {
    urlPath = 'histoday';
} else if (parseInt(resolution, 10) < 60) {
    urlPath = 'histominute';
} else {
    urlPath = 'histohour';
}
    console.log('[getBars]: urlPath', urlPath);
    console.log(`[getBars]: Making request to ${urlPath}?${query}`);

    try {
        const data = await makeApiRequest(`data/v2/${urlPath}?${query}`);
        console.log('[getBars]: Received data', data);

        if (data.Response && data.Response === 'Error' || data.Data.Data.length === 0) {
            console.warn(`[getBars]: No data returned from API for resolution ${resolution}`);
            onHistoryCallback([], {
                noData: true,
            });
            return;
        }
			let bars = [];
			data.Data.Data.forEach(bar => {
				if (bar.time >= from && bar.time < to) {
					bars = [...bars, {
						time: bar.time * 1000,
						low: bar.low,
						high: bar.high,
						open: bar.open,
						close: bar.close,
					}];
				}
			});
// 			if (firstDataRequest) {
// 				lastBarsCache.set(symbolInfo.full_name, {
// 					...bars[bars.length - 1],
// 				});
// 			}
			console.log(`[getBars]: returned ${bars.length} bar(s)`);
			onHistoryCallback(bars, {
				noData: false,
			});
		} catch (error) {
			console.log('[getBars]: Get error', error);
			onErrorCallback(error);
		}
	},
/////////////////////////////////////////////////////////////////////////
subscribeBars: (
	symbolInfo,
	resolution,
	onRealtimeCallback,
	subscriberUID,
	onResetCacheNeededCallback,
) => {
	console.log('[subscribeBars]: Method call with subscriberUID:', subscriberUID);
	const lastBar = lastBarsCache.get(symbolInfo.full_name);
	symbolInfo.lastBar = lastBar; // Adicionando lastBar ao symbolInfo
	subscribeOnStream(
		symbolInfo,
		resolution,
		onRealtimeCallback,
		subscriberUID,
		onResetCacheNeededCallback,
		lastBar,  // Passando o lastBar aqui
	);
},


/////////////////////////////////////////////////////////////////////////

	unsubscribeBars: (subscriberUID) => {
		console.log('[unsubscribeBars]: Method call with subscriberUID:', subscriberUID);
		unsubscribeFromStream(subscriberUID);
	},
};

// Adicionando uma função para atualizar o lastBar no cache
function updateLastBar(symbol, newBar) {
  const lastBar = lastBarsCache.get(symbol);
  if (newBar.time > lastBar.time) {
    lastBarsCache.set(symbol, newBar);
  }
}