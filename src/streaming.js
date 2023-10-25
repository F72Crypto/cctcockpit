import { parseFullSymbol } from '/cockpit/tvchart/src/helpers.js';

let socket;
const channelToSubscription = new Map();

function connectToWebSocket(exchange, formattedPair, callback, symbolInfo) {
  console.log(`Tentando conectar ao WebSocket da ${exchange}...`);
  if (socket) {
    socket.close();
  }
  
  let url;
  if (exchange === 'Binance') {
    url = `wss://stream.binance.com:9443/ws/${formattedPair}@trade`;
    console.log(`Conectando ao WebSocket com a URL: ${url}`);
  } else if (exchange === 'Bybit') {
    url = 'wss://stream.bybit.com/realtime';
  } else {
    url = 'wss://streamer.cryptocompare.com/v2?api_key=260bab31ab443ce21b37555a6aa514d26078d313084e55e2ad6d15f0628a6b74';
  }

  socket = new WebSocket(url);
  console.log(`Tentando conectar ao WebSocket com a URL: ${url}`);

  socket.addEventListener('open', () => {
    console.log('[socket] Conectado com sucesso!');
    console.log(`Status da conexão: ${socket.readyState}`);
    if (callback) callback();    
  });

  socket.addEventListener('close', (reason) => {
    console.log('[socket] Desconectado! Motivo:', reason);
    console.log(`Status da conexão: ${socket.readyState}`);     
  });

  socket.addEventListener('error', (error) => {
    console.log('[socket] Erro na conexão:', error);
    console.log(`Detalhes do erro: ${JSON.stringify(error)}`);
  });

  socket.addEventListener('message', (event) => {
    const data = event.data;
    console.log("Dados recebidos do WebSocket:", data); // Debug
    const parsedData = JSON.parse(data);
    console.log("Dados parseados:", parsedData); // Debug

    if (parsedData.TYPE === "429") {
      console.error("Erro 429: Muitas conexões. Desconectando...");
      socket.close();
      return;
    }

    if (parsedData.e && parsedData.e === "trade") {
      const tradePrice = parseFloat(parsedData.p);
      const tradeTime = parseInt(parsedData.T);
      if (!isNaN(tradePrice) && !isNaN(tradeTime)) {
        console.log("Dados válidos, continuando processamento.");
      } else {
        console.error("Dados recebidos do WebSocket da Binance estão em um formato válido.");
      }
      const channelString = `0~${exchange}~${parsedData.s}`;
      let subscriptionItem = channelToSubscription.get(channelString);

      if (subscriptionItem) {
        console.log("Achou o subscriptionItem, caraca!"); // Debug
        let newLastBar = updateBar({ price: tradePrice, ts: tradeTime }, subscriptionItem);
        subscriptionItem.lastBar = newLastBar;
        lastBarsCache.set(subscriptionItem.subscriberUID, newLastBar); // Atualizando o cache
        console.log("Atualizou a última barra, show!"); // Debug

        subscriptionItem.handlers.forEach(handler => {
          handler.callback(newLastBar);
          console.log("Chamou o callback, vai que é tua!"); // Debug
        });
      }
    }
  });
}

function updateBar(data, subscriptionItem) {
  let lastBar = { ...subscriptionItem.lastBar };
  let resolution = subscriptionItem.resolution;
  let coeff = resolution * 60; // Supondo que a resolução está em minutos
  let rounded = Math.floor(data.ts / coeff) * coeff; // Supondo que data.ts está em segundos
  let lastBarSec = lastBar.time / 1000;

  let _lastBar;

  if (rounded > lastBarSec) {
    _lastBar = {
      time: rounded * 1000,
      open: lastBar.close,
      high: lastBar.close,
      low: lastBar.close,
      close: data.price,
      volume: data.volume
    };
  } else {
    if (data.price < lastBar.low) {
      lastBar.low = data.price;
    } else if (data.price > lastBar.high) {
      lastBar.high = data.price;
    }

    lastBar.volume += data.volume;
    lastBar.close = data.price;
    _lastBar = lastBar;
  }

  return _lastBar;
}

export function subscribeOnStream(
  symbolInfo,
  resolution,
  onRealtimeCallback,
  subscriberUID,
  onResetCacheNeededCallback,
) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    console.error("Socket ainda no está conectado, aguarde!");
    setTimeout(() => subscribeOnStream(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback), 5000);
    return;
  }
  const parsedSymbol = parseFullSymbol(symbolInfo.full_name);
  const channelString = `24~CCCAGG~${parsedSymbol.fromSymbol}~${parsedSymbol.toSymbol}`;
  const handler = {
    id: subscriberUID,
    callback: (bar) => {
      console.log("Callback chamado com:", bar);
      onRealtimeCallback(bar);
    },
  };

  let lastBar = symbolInfo.lastBar ? symbolInfo.lastBar : { time: 0, open: 0, high: 0, low: 0, close: 0, volume: 0 };
  let subscriptionItem = channelToSubscription.get(channelString);

  if (subscriptionItem) {
    subscriptionItem.handlers.push(handler);
    return;
  }

  subscriptionItem = {
    subscriberUID,
    resolution,
    lastBar,
    handlers: [handler],
  };

  channelToSubscription.set(channelString, subscriptionItem);
}

export function unsubscribeFromStream(subscriberUID) {
  for (const channelString of channelToSubscription.keys()) {
    const subscriptionItem = channelToSubscription.get(channelString);
    const handlerIndex = subscriptionItem.handlers.findIndex(handler => handler.id === subscriberUID);

    if (handlerIndex !== -1) {
      subscriptionItem.handlers.splice(handlerIndex, 1);

      if (subscriptionItem.handlers.length === 0) {
        channelToSubscription.delete(channelString);
        break;
      }
    }
  }
}

export { connectToWebSocket };
connectToWebSocket('Binance', 'btcusdt', () => {
  subscribeOnStream(symbolInfo, resolution, onRealtimeCallback, subscriberUID, onResetCacheNeededCallback);
});
