from app import app, mysql
import json

with app.app_context():
    cur = mysql.connection.cursor()
    cur.execute("SELECT * FROM practicalqa")
    rows = cur.fetchall()
    print(json.dumps(rows, default=str, indent=2))
    cur.close()
