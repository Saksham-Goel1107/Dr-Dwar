import os
import pandas as pd
import sqlite3

# Set file paths
downloads = os.path.join(os.path.expanduser('~'), 'Downloads')
csv_path = os.path.join(downloads, 'data.csv')      # Make sure your CSV file is named 'data.csv'
db_path = os.path.join(downloads, 'facilities.db')

# Read CSV into DataFrame
df = pd.read_csv(csv_path)

# Create (or overwrite) SQLite database and write data
conn = sqlite3.connect(db_path)
df.to_sql('facilities', conn, if_exists='replace', index=False)
conn.close()

print(f"Converted {csv_path} to {db_path} successfully!")
