import MySQLdb
import os
from dotenv import load_dotenv

load_dotenv()

# Database Config from app.py
HOST = 'localhost'
USER = 'root'
PORT = 3306
PASSWORD = 'Pavan@22'
DB_NAME = 'quizapp'

def add_tables():
    print(f"Connecting to database '{DB_NAME}'...")
    try:
        db = MySQLdb.connect(host=HOST, user=USER, passwd=PASSWORD, db=DB_NAME, port=PORT)
        cursor = db.cursor()
        print("Connected successfully.")
    except Exception as e:
        print(f"Error connecting to database: {e}")
        return

    tables = {
        "interview_conversations": """
            CREATE TABLE IF NOT EXISTS interview_conversations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) NOT NULL,
                test_id VARCHAR(100) NOT NULL,
                chat_history LONGTEXT NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                uid BIGINT NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """,
        "exam_videos": """
            CREATE TABLE IF NOT EXISTS exam_videos (
                id INT AUTO_INCREMENT PRIMARY KEY,
                email VARCHAR(100) NOT NULL,
                test_id VARCHAR(100) NOT NULL,
                video_path VARCHAR(255) NOT NULL,
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                uid BIGINT NOT NULL
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """
    }

    for table_name, sql in tables.items():
        try:
            print(f"Creating table '{table_name}'...")
            cursor.execute(sql)
            print(f"Table '{table_name}' created successfully.")
        except Exception as e:
            print(f"Error creating table '{table_name}': {e}")

    db.commit()
    db.close()
    print("Database updates completed.")

if __name__ == "__main__":
    add_tables()
