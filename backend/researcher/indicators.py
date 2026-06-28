import pandas as pd
import pandas_ta as ta
from backend.researcher.binance import BINANCE

class TechnicalIndicators:
    def calculate_indicators(self, data):
        df = data.copy()
        df.sort_index(inplace = True)
        close = df['close']

        indicators = pd.DataFrame(index=df.index)

        indicators['SMA_200'] = ta.sma(close, length=200)
        indicators['SMA_50'] = ta.sma(close, length=50)
        
        indicators['RSI_14'] = ta.rsi(close, length=14)

        macd_df = ta.macd(close, fast=12, slow=26, signal=9)
        indicators['MACD'] = macd_df.iloc[:, 0]
        indicators['MACDs'] = macd_df.iloc[:, 2]

        bb_df = ta.bbands(close, length=20, std=2)
        indicators['BB_LOWER'] = bb_df.iloc[:, 0]
        indicators['BB_UPPER'] = bb_df.iloc[:, 2]

        adx_df = ta.adx(df['high'], df['low'], df['close'], length=14)
        indicators['ADX_14'] = adx_df['ADX_14']

        indicators['ATR_14'] = ta.atr(df['high'], df['low'], df['close'], length=14)

        return indicators
    
    def ohlcv_indicators_combined(self):
        bi = BINANCE()
        data = bi.load_data()

        indicators = self.calculate_indicators(data)

        return data.join(indicators).dropna()