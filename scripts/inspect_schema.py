import duckdb
con = duckdb.connect()
print('Live hotspots columns:')
for col in con.execute("DESCRIBE SELECT * FROM 'data/processed/live_hotspots_30d.parquet'").fetchall():
    print(' ', col[0], col[1])
print('\nSample row:')
print(con.execute("SELECT * FROM 'data/processed/live_hotspots_30d.parquet' LIMIT 1").fetchone())
print('\nGrid 025 columns:')
for col in con.execute("DESCRIBE SELECT * FROM 'data/processed/grid_025/*/*.parquet'").fetchall():
    print(' ', col[0], col[1])
