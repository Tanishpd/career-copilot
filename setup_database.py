
import MySQLdb
import sys
import os

# Database Config
HOST = 'localhost'
USER = 'root'
PORT = 3306
PASSWORD = 'wuljplvxxttgcjej' # Using the App Password? NO. Wait.
# User changed app.py config for MAIL, but DB config is different.
# Check app.py for DB config.
# Step 35: User changed DB password to 'Pavan@22'.

DB_PASSWORD = 'Pavan@22'
DB_NAME = 'quizapp'

SQL_FILE_PATH = os.path.join("DB", "quizappstructure.sql")

def import_database():
    print(f"Connecting to database '{DB_NAME}'...")
    try:
        db = MySQLdb.connect(host=HOST, user=USER, passwd=DB_PASSWORD, db=DB_NAME, port=PORT)
        cursor = db.cursor()
        print("Connected successfully.")
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return

    print(f"Reading SQL file: {SQL_FILE_PATH}...")
    try:
        with open(SQL_FILE_PATH, 'r') as f:
            sql_content = f.read()
    except FileNotFoundError:
        print(f"Error: Could not find {SQL_FILE_PATH}")
        return

    # Split by semicolon to get individual commands
    # This is a basic parser; for complex SQL definition it might need more robustness
    # but for standard dumps it usually works if we ignore comments.
    
    commands = sql_content.split(';')
    
    success_count = 0
    error_count = 0

    for command in commands:
        command = command.strip()
        if not command:
            continue
            
        try:
            cursor.execute(command)
            success_count += 1
        except Exception as e:
            # Ignore empty queries or minor warnings
            if "Query was empty" not in str(e):
                print(f"Warning executing command: {command[:50]}... -> {e}")
                error_count += 1
    
    db.commit()
    db.close()
    print(f"\nDatabase setup completed.")
    print(f"Executed {success_count} commands successfully.")
    print(f"Encountered {error_count} warnings/errors.")

if __name__ == "__main__":
    import_database()
