
import MySQLdb
import sys

print("Attempting to connect to the database...")
try:
    db = MySQLdb.connect(
        host='localhost',
        user='root',
        passwd='Pavan@22',
        db='quizapp',
        port=3306
    )
    cursor = db.cursor()
    cursor.execute("SELECT 1")
    print("SUCCESS: Connected to database 'quizapp'")
    db.close()
except ImportError:
    print("MySQLdb module not found. Trying mysql.connector...")
    try:
        import mysql.connector
        db = mysql.connector.connect(
            host='localhost',
            user='root',
            passwd='Pavan@22',
            database='quizapp',
            port=3306
        )
        print("SUCCESS: Connected to database 'quizapp' using mysql.connector")
        db.close()
    except Exception as e:
        print(f"FAILURE: Could not connect using mysql.connector either. Error: {e}")
        sys.exit(1)
except Exception as e:
    print(f"FAILURE: Could not connect. Error: {e}")
    sys.exit(1)
