import MySQLdb

HOST = 'localhost'
USER = 'root'
PORT = 3306
PASSWORD = 'MYSQL_PASSWORD_PURGED_ROTATE_ME'
DB_NAME = 'quizapp'

try:
    db = MySQLdb.connect(host=HOST, user=USER, passwd=PASSWORD, db=DB_NAME, port=PORT)
    cursor = db.cursor(MySQLdb.cursors.DictCursor)
    
    email = 'eng22cs0117@dsu.edu.in'
    cursor.execute("SELECT email, user_type, user_login FROM users WHERE email = %s", (email,))
    row = cursor.fetchone()
    if row:
        print(f"User found: {row}")
    else:
        print(f"User with email {email} not found.")
    
    # Also check without the domain just in case
    email_short = 'eng22cs0117'
    cursor.execute("SELECT email, user_type, user_login FROM users WHERE email LIKE %s", (email_short + '%',))
    rows = cursor.fetchall()
    if rows:
        print(f"Similar users found: {rows}")
        
    db.close()
except Exception as e:
    print(f"Error: {e}")
