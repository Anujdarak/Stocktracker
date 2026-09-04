import urllib.request
import os

def fetch_nse_equity_list():
    url = 'https://nsearchives.nseindia.com/content/equities/EQUITY_L.csv'
    file_path = os.path.join(os.path.dirname(__file__), 'EQUITY_L.csv')

    print(f"Fetching NSE equity list from {url}...")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
        with urllib.request.urlopen(req, timeout=10) as response, open(file_path, 'wb') as out_file:
            out_file.write(response.read())
        print(f"Successfully saved to {file_path}")
    except Exception as e:
        print(f"Failed to fetch NSE list: {e}")

if __name__ == '__main__':
    fetch_nse_equity_list()
