import os
import csv
from typing import List, Dict

class SearchService:
    def __init__(self):
        self.equities: List[Dict[str, str]] = []
        self._load_data()

    def _load_data(self):
        data_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'data', 'EQUITY_L.csv')
        if not os.path.exists(data_path):
            print(f"Warning: Data file not found at {data_path}")
            return

        with open(data_path, 'r', encoding='utf-8') as f:
            reader = csv.reader(f)
            headers = next(reader)

            # Find indices for SYMBOL and NAME OF COMPANY just in case columns shift
            try:
                symbol_idx = headers.index('SYMBOL')
                name_idx = headers.index('NAME OF COMPANY')
            except ValueError:
                symbol_idx = 0
                name_idx = 1

            for row in reader:
                if len(row) > max(symbol_idx, name_idx):
                    self.equities.append({
                        "symbol": row[symbol_idx].strip(),
                        "name": row[name_idx].strip()
                    })

        # Supplemental popular/recent NSE listings that might not be in older EQUITY_L exports
        supplemental = [
            {"symbol": "ZOMATO", "name": "Zomato Limited"},
            {"symbol": "JIOFIN", "name": "Jio Financial Services Limited"},
            {"symbol": "PAYTM", "name": "One97 Communications Limited (Paytm)"},
            {"symbol": "NYKAA", "name": "FSN E-Commerce Ventures Limited (Nykaa)"},
            {"symbol": "SWIGGY", "name": "Swiggy Limited"},
            {"symbol": "DELHIVERY", "name": "Delhivery Limited"},
            {"symbol": "POLICYBZR", "name": "PB Fintech Limited (PolicyBazaar)"},
            {"symbol": "SUZLON", "name": "Suzlon Energy Limited"},
            {"symbol": "IRFC", "name": "Indian Railway Finance Corporation Limited"},
            {"symbol": "RVNL", "name": "Rail Vikas Nigam Limited"},
            {"symbol": "MAZDOCK", "name": "Mazagon Dock Shipbuilders Limited"},
            {"symbol": "COCHINSHIP", "name": "Cochin Shipyard Limited"},
            {"symbol": "TATAPOWER", "name": "Tata Power Company Limited"},
            {"symbol": "TATACOMM", "name": "Tata Communications Limited"},
            {"symbol": "HAL", "name": "Hindustan Aeronautics Limited"},
            {"symbol": "BEL", "name": "Bharat Electronics Limited"},
            {"symbol": "BEML", "name": "BEML Limited"},
            {"symbol": "BDL", "name": "Bharat Dynamics Limited"},
            {"symbol": "DATAPATTNS", "name": "Data Patterns (India) Limited"},
            {"symbol": "VBL", "name": "Varun Beverages Limited"},
            {"symbol": "LODHA", "name": "Macrotech Developers Limited (Lodha)"},
            {"symbol": "MANKIND", "name": "Mankind Pharma Limited"},
            {"symbol": "IDEA", "name": "Vodafone Idea Limited"},
        ]

        existing_symbols = {eq["symbol"].upper() for eq in self.equities}
        for supp in supplemental:
            if supp["symbol"].upper() not in existing_symbols:
                self.equities.append(supp)
                existing_symbols.add(supp["symbol"].upper())

    def search(self, query: str, limit: int = 10) -> List[Dict[str, str]]:
        if not query or not self.equities:
            return []

        query = query.lower()
        results = []

        # Simple rank: exact match or starts with gets higher priority than 'contains'
        for eq in self.equities:
            symbol = eq['symbol'].lower()
            name = eq['name'].lower()

            score = 0
            if query == symbol:
                score = 100
            elif symbol.startswith(query):
                score = 80
            elif query in name.split():
                score = 60
            elif name.startswith(query):
                score = 50
            elif query in symbol or query in name:
                score = 20

            if score > 0:
                results.append((score, eq))

        # Sort by score descending, then symbol alphabetically
        results.sort(key=lambda x: (-x[0], x[1]["symbol"]))

        return [res[1] for res in results[:limit]]

search_service = SearchService()
