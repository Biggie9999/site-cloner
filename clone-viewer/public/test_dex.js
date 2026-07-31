const addrs = ['So11111111111111111111111111111111111111112', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'];
fetch(`https://api.dexscreener.com/latest/dex/tokens/${addrs.join(',')}`)
  .then(res => res.json())
  .then(data => {
      console.log(data.pairs ? data.pairs.length + ' pairs' : 'no pairs');
      if (data.pairs) {
          addrs.forEach(a => {
              const p = data.pairs.find(p => p.baseToken.address === a);
              console.log(a, p ? p.priceUsd : 'not found');
          });
      }
  }).catch(e => console.error(e));
