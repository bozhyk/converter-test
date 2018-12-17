import React, { Component } from 'react';
import './App.css';

const getTransactionsUrl = 'https://7np770qqk5.execute-api.eu-west-1.amazonaws.com/prod/get-transaction';
const postTransactionUrl = 'https://7np770qqk5.execute-api.eu-west-1.amazonaws.com/prod/process-transactions';
const round = (value, decimals) => Number(Math.round(value + 'e' + decimals) +'e-' + decimals);
const ratesCache = {};
const TRANSACTION_COUNT = 100;

class App extends Component {

    constructor() {
        super();
        this.state = {
            counter: 0
        }
    }    

  convert = async () => {
    let transactResp = await fetch(getTransactionsUrl);
    let json = await transactResp.json();

    let { amount, currency, createdAt, exchangeUrl, checksum } = json;

    let strDate = createdAt.split('T')[0];
    let key = `${strDate}-${currency}`;
    let rate = ratesCache[key];
    if (!rate) { // Try to cache exchange rate for certain currency on certain date
        let ratesResp = await fetch(`${exchangeUrl.replace('Y-M-D', strDate)}&symbols=${currency}`);
        let obj = await ratesResp.json();
        rate = obj.rates[currency];
        if (rate) {
            ratesCache[key] = rate;
        }
    } else {
        console.log('use cached exchange rate');
    }

    this.setState({
        counter: ++this.state.counter
    })

    return {
        createdAt: createdAt,
        currency: currency,
        amount: amount,
        convertedAmount: round(amount / rate, 4),
        checksum: checksum
    };
  }

  clickHandler = async () => {

    this.setState({
        counter: 0
    });

    const arrayOfPromises = [];
    for (let i = 0; i < TRANSACTION_COUNT; i++) {
        arrayOfPromises[i] = this.convert();
    }
    
    const arrayOfResults = await Promise.all(arrayOfPromises);
    console.log('results:', arrayOfResults);
    
    const response = await fetch(postTransactionUrl, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ transactions: arrayOfResults})
      });
    
    const json = await response.json();
    console.log(json);
    
  }

  render() {
    return (
      <div className="App">
        <button className="btnStart" onClick={this.clickHandler} >Convert</button>
        <p>{this.state.counter}</p>
      </div>
    );
  }
}

export default App;
