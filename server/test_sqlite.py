import sqlite3
import os

db_path = os.path.expandvars('%APPDATA%/pgadmin/pgadmin4.db')
print("DB Path:", db_path)
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get tables
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
print("Tables:", cursor.fetchall())

import sys
sys.path.append(r'C:\Users\harish\\.gemini\antigravity-ide\scratch\pga4decrypt')
from lib import crypto

# Get servers
try:
    cursor.execute("SELECT server.name, server.password, user.password as key FROM server JOIN user ON user.id = server.user_id")
    rows = cursor.fetchall()
    for row in rows:
        name, password, key = row
        print("Server:", name)
        print("Encrypted Password (hex):", password)
        print("Key:", key)
        try:
            password_b64 = bytes.fromhex(password).decode('utf-8')
            decrypted = crypto.decrypt(password_b64, key)
            print("Decrypted:", decrypted)
            print("Decrypted String:", decrypted.decode('utf-8'))
        except Exception as e:
            print("Decryption Error:", e)
except Exception as e:
    print("Error querying server:", e)




