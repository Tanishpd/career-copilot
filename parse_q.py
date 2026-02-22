from app import app, mysql
import json
import re

with app.app_context():
    cur = mysql.connection.cursor()
    cur.execute("SELECT q FROM practicalqa LIMIT 1")
    row = cur.fetchone()
    if row:
        q_content = row['q']
        with open("q_content.txt", "w", encoding="utf-8") as f:
            f.write(q_content)
        print("Content written to q_content.txt")
    cur.close()
