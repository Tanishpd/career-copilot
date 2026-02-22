from app import app, mysql
import sys

with app.app_context():
    cur = mysql.connection.cursor()
    email = 'eng22cs0117@dsu.edu.in'
    cur.execute("SELECT email, user_type, user_login FROM users WHERE email = %s", (email,))
    row = cur.fetchone()
    if row:
        print(f"User found: {row}")
    else:
        print(f"User with email {email} not found.")
    
    # Also check without the domain just in case
    email_short = 'eng22cs0117'
    cur.execute("SELECT email, user_type, user_login FROM users WHERE email LIKE %s", (email_short + '%',))
    rows = cur.fetchall()
    if rows:
        print(f"Similar users found: {rows}")
    
    cur.close()
