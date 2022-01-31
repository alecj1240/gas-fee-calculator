import React, { useState, useEffect } from 'react';
import './App.css';
import * as ethers from 'ethers';

export default function App() {
  const walletAddress = useWalletAddress();
  return (
    <div>
      <p>React⚛️ + Vite⚡ + Replit</p>
      <button className="primary" onClick={connect}>Connect wallet</button>
    </div>
  );
}

function useWalletAddress() {
  const {ethereum} = window;
	const [address, setAddress] = useState(ethereum && ethereum.selectedAddress);

	useEffect(() => {
		const onAddressChanged = (addresses) => setAddress(addresses[0]);
		ethereum && ethereum.on('accountsChanged', onAddressChanged);
		return () => {
			ethereum && ethereum.removeListener('accountsChanged', onAddressChanged);
		};
	}, []);

	return address;
}

function useChainId() {
  const {ethereum} = window;
	const [chainId, setChainId] = useState(ethereum && ethereum.chainId || '1');

	useEffect(() => {
		ethereum && ethereum.on('chainChanged', setChainId);
		return () => {
			ethereum && ethereum.removeListener('chainChanged', setChainId);
		}
	}, []);

	return parseInt(chainId);
}

function multiply(x, y) {
    var prod = [];
    var i;
    for (i=0; i < x.length; i++) {
        prod[i] = x[i] * y[i];
    }

    return prod;
}

function formatter(num) {
  return num > 999999 ? (num/1e6).toFixed(3) + ' million' : num;
}

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });

    return vars;
}

function comma(x) {
    var parts = x.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");

    return parts.join(".");
}

async function connect() {
	window.ethereum.request({ method: 'eth_requestAccounts' });
}

async function getTxs(address) {
  const chainConfig = []

  chainConfig['0x1'] = {id: '0x1', shortname: 'eth', name:'Ethereum', symbol: 'eth', coingecko_name: 'ethereum', token: 'Ξ', color: '#03a9f4', explorer_uri: 'https://api.etherscan.io', key: 'KKEHS5KMBY8KJSTBKUXRT9X33NZUNDPSHD'}
  chainConfig['0x38'] = {id: '0x38', shortname: 'bsc', name:'Binance Smart Chain', symbol: 'bnb', coingecko_name: 'binancecoin', token: 'Ḇ', color: "#f4ce03", explorer_uri: 'https://api.bscscan.com', key: 'UWB7YUCVQXT7TGFK41TNJSJBIHDQ1JGU9D'}
  chainConfig['0x64'] = {id: '0x64', shortname: 'xdai', name:'xDai', symbol: 'xdai', coingecko_name: 'xdai', token: 'Ẍ', color: '#48a9a6', explorer_uri: 'https://blockscout.com/xdai/mainnet', key: ''}
  chainConfig['0x89'] = {id: '0x89', shortname: 'matic', name:'Polygon', symbol: 'matic', coingecko_name: 'matic-network', token: 'M̃', color: '#9d03f4', explorer_uri: 'https://api.polygonscan.com', key: 'QDPWKASEUSSYTKX9ZVMSSQGX4PTCZGHNC8'}
  chainConfig['0xfa'] = {id: '0xfa', shortname: 'ftm', name:'Fantom', symbol: 'ftm', coingecko_name: 'fantom', token: 'ƒ', color: '#00dbff', explorer_uri: 'https://api.ftmscan.com', key: 'B5UU3GDR3VJYVXFYT6RPK5RA6I8J5CV6B3'}

  // Detect chainId
  const chainId = '0x' + useChainId();

  if (!chainId in chainConfig) {
      let authorizedNetworks = "";
      for (const [key, network] of Object.entries(chainConfig)) {
          authorizedNetworks += network.name + ", ";
      }
      authorizedNetworks += '[...]'

      console.log('ChainId ' + chainId + ' is not supported. Select a valid network.');
      return;
  }

  let coingeckoSymbol = chainConfig[chainId].coingecko_name
  let tokenusd = await fetch('https://api.coingecko.com/api/v3/simple/price?ids='+coingeckoSymbol+'&vs_currencies=usd')
      .then(response => {return response.json()})
      .catch(err => {
          console.log('error: ', err);
      })

  tokenusd = tokenusd[coingeckoSymbol].usd;

  console.log('fetching transcation data...');
  
  let key = chainConfig[chainId].key
  let u = chainConfig[chainId].explorer_uri+`/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&sort=asc`
  if (chainConfig[chainId].key) { u += `&apikey=${key}` }
  let response = await fetch(u)

  if (response.ok) { // if HTTP-status is 200-299
      var json = await response.json();
  } else {
      console.error("HTTP-Error: " + response.status);
  }

  let txs = json['result']
  let n = txs.length
  let from, txs2

  while (n===10000) {
      from = txs[txs.length - 1].blockNumber
      u = chainConfig[chainId].explorer_uri+`/api?module=account&action=txlist&address=${address}&startblock=${from}&endblock=99999999&sort=asc&apikey=${key}`
      response = await fetch(u)

      if (response.ok) { // if HTTP-status is 200-299
          json = await response.json();
      } else {
          console.log('status: ' + response.status);
          break
      }

      txs2 = json['result']
      n = txs2.length
      txs.push.apply(txs, txs2)
  }

  let txsOut = $.grep(txs, function(v) {
      return v.from === address.toLowerCase();
  });

  txsOut = txsOut.map(({ confirmations, ...item }) => item);
  txsOut = new Set(txsOut.map(JSON.stringify));
  txsOut = Array.from(txsOut).map(JSON.parse);
  
  var nOut = txsOut.length;

  var txsOutFail = $.grep(txsOut, function(v) {
    return v.isError === '1';
  });
  
  var nOutFail = txsOutFail.length;
  
  if (nOut > 0) {
      var gasUsed = txsOut.map(value => parseInt(value.gasUsed));
      var gasUsedTotal = gasUsed.reduce((partial_sum, a) => partial_sum + a,0); 
      var gasPrice = txsOut.map(value => parseInt(value.gasPrice));
      var gasPriceMin = Math.min(...gasPrice);
      var gasPriceMax = Math.max(...gasPrice);
      var gasFee = multiply(gasPrice, gasUsed);
      var gasFeeTotal = gasFee.reduce((partial_sum, a) => partial_sum + a,0); 
      var gasPriceTotal = gasPrice.reduce((partial_sum, a) => partial_sum + a,0);
      var gasUsedFail = txsOutFail.map(value => parseInt(value.gasUsed));
      var gasPriceFail = txsOutFail.map(value => parseInt(value.gasPrice));
      var gasFeeFail = multiply(gasPriceFail, gasUsedFail);
      var gasFeeTotalFail = gasFeeFail.reduce((partial_sum, a) => partial_sum + a,0);
      var oofCost;

      gasPriceTotal = (gasPriceTotal / nOut / 1e9).toFixed(1);
      gasFeeTotal = (gasFeeTotal / 1e18).toFixed(3);
      
      if (nOutFail > 0) {
          gasFeeTotalFail = (gasFeeTotalFail / 1e18).toFixed(3);
          var oof = Math.max(...gasFeeFail)/1e18;

          if (oof > 0.1) {
            var i = gasFeeFail.reduce((iMax, x, i, arr) => x > arr[iMax] ? i : iMax, 0);
            var tx = txsOutFail[i];
          }
      }  else {
          gasFeeTotalFail = 'nothing';
      }

    if (tokenusd !== null) {
      oofCost = tokenusd * gasFeeTotalFail;
      tokenusd = tokenusd * gasFeeTotal;
    }

  } else {
    gasUsedTotal = 0;
    gasFeeTotal = 0;
  }

  return [gasUsedTotal, gasPriceTotal, gasFeeTotal, gasFeeTotalFail, tokenusd, oofCost, nOutFail, nOut];
}