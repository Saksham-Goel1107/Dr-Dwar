import pdfplumber
import csv

pdf_path = r"C:\Users\saksh\Downloads\kendra_20_9_2025 @ 21_58_44.pdf" # Update this with your PDF filename
csv_path = "output.csv"

all_rows = []
header_seen = False
actual_header = []

with pdfplumber.open(pdf_path) as pdf:
    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                # Identify and skip repeated header
                if not header_seen:
                    actual_header = row
                    all_rows.append(row)
                    header_seen = True
                elif row != actual_header:
                    all_rows.append(row)

# Write to CSV
with open(csv_path, "w", newline='', encoding="utf-8") as f:
    writer = csv.writer(f)
    writer.writerows(all_rows)

print(f"Data extracted to {csv_path}")
