import os
import MySQLdb

HOST = 'localhost'
USER = 'root'
PORT = 3306
PASSWORD = os.environ.get("MYSQL_PASSWORD", "")
DB_NAME = 'quizapp'

try:
    db = MySQLdb.connect(host=HOST, user=USER, passwd=PASSWORD, db=DB_NAME, port=PORT)
    cursor = db.cursor()
    
    email = 'eng22cs0117@dsu.edu.in'
    cursor.execute("UPDATE users SET user_login = 0 WHERE email = %s", (email,))
    db.commit()
    print(f"Successfully reset user_login for {email}. Rows affected: {cursor.rowcount}")
    
    db.close()
except Exception as e:
    print(f"Error: {e}")
