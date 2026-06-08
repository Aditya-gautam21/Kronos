import os 
from dotenv import load_dotenv
import uuid
from datetime import datetime, timezone
from supabase import create_client

load_dotenv()
class Database:
    def __init__(self, trade_data: dict):
        self.supabase = create_client(
            supabase_url=os.getenv('SUPABASE_URL'),
            supabase_key=os.getenv('SUPABASE_SECRET_ROLE_KEY')
        )

        self.trade_data = trade_data

    def trades(self):
        self.trade_id = str(uuid.uuid4())

        trade = {
            'trade_id': self.trade_id,
            'symbol': self.trade_data['initial_trade_info']['symbol'],
            'direction': self.trade_data['initial_trade_info']['direction'],
            'confidence': self.trade_data['initial_trade_info']['confidence'],
            'entry_order_id':self.trade_data['orders']['entry']['orderId'],
            'entry_price':self.trade_data['initial_trade_info']['entry_price'],
            'quantity':self.trade_data['position_size']['margin_usdt'],
            'leverage':self.trade_data['position_size']['leverage'],
            'sl_price':self.trade_data['initial_trade_info']['stop_loss'],
            'tp_price':self.trade_data['initial_trade_info']['take_profit'],
            'opened_at': datetime.now(timezone.utc).isoformat()
        }

        return self.supabase.table("trades").insert(trade).execute()
    
    def trade_raw_data(self):
        raw_data = {
            'trade_id': self.trade_id,
            'llm_output': self.trade_data,
            'recorded_at': datetime.now(timezone.utc).isoformat()
        }

        return self.supabase.table('trade_raw_data').insert(raw_data).execute()
    
    def trade_results(self):
        results = {
            'trade_id': self.trade_id,
            'exit_order_id':,
            'exit_price':,
            'exit_reason':,
            'gross_pnl':,
            'trading_fees':,
            'total_funding_fees':,
            'net_pnl':,
            'holding_duration':,
            'funding_periods':,
            'recorded_at':
        }

        return self.supabase.table("trade_results").insert(results).execute()