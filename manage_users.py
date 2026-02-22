
import MySQLdb
import sys

# Database Config
HOST = 'localhost'
USER = 'root'
PORT = 3306
PASSWORD = 'MYSQL_PASSWORD_PURGED_ROTATE_ME' # Based on user's update
DB_NAME = 'quizapp'

def check_and_reset_users():
    print(f"Connecting to database '{DB_NAME}'...")
    try:
        db = MySQLdb.connect(host=HOST, user=USER, passwd=PASSWORD, db=DB_NAME, port=PORT)
        cursor = db.cursor()
    except Exception as e:
        print(f"Error connecting: {e}")
        return

    print("\n--- Current Users ---")
    try:
        cursor.execute("SELECT uid, name, email, user_type, user_login FROM users")
        rows = cursor.fetchall()
        if not rows:
            print("No users found in database!")
        else:
            print(f"{'UID':<5} {'Name':<20} {'Email':<30} {'Type':<10} {'LoginStatus':<10}")
            print("-" * 80)
            for row in rows:
                # row is a tuple (uid, name, email, user_type, user_login)
                print(f"{row[0]:<5} {row[1]:<20} {row[2]:<30} {row[3]:<10} {row[4]:<10}")
                
            # Reset Login Status
            print("\nResetting all 'user_login' flags to 0...")
            cursor.execute("UPDATE users SET user_login = 0")
            db.commit()
            print("Done. All users logged out.")
            
    except Exception as e:
        print(f"Error querying users: {e}")
    
    db.close()

if __name__ == "__main__":
    check_and_reset_users()
