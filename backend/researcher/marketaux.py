import http.client
import urllib.parse
import os
from dotenv import load_dotenv

load_dotenv()

class MarketAux:
    def marketaux_data(self, symbol: str):
        conn = http.client.HTTPSConnection("api.marketaux.com")

        params = urllib.parse.urlencode({
            "api_token": os.getenv("MARKETAUX_AUTH_TOKEN"),
            "symbols": symbol,
            "limit": 3,
        })

        conn.request("GET", f"/v1/news/all?{params}")

        response = conn.getresponse()

        print(response.status)
        print(response.reason)
        print(response.read().decode())

if __name__ == '__main__':
    MarketAux().marketaux_data('RIVER')