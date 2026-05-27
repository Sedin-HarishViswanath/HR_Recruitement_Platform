import sqlite3
import os
import base64
import hashlib
from cryptography.hazmat.backends import default_backend
from cryptography.hazmat.primitives.ciphers import Cipher
from cryptography.hazmat.primitives.ciphers.algorithms import AES
from cryptography.hazmat.primitives.ciphers.modes import CFB8

db_path = os.path.expandvars('%APPDATA%/pgadmin/pgadmin4.db')
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# Get server password
cursor.execute("SELECT password FROM server WHERE id=1")
encrypted_password = cursor.fetchone()[0]
ciphertext = base64.b64decode(bytes.fromhex(encrypted_password).decode('utf-8'))
iv = ciphertext[:16]
data = ciphertext[16:]

# Get keys
cursor.execute("SELECT value FROM keys WHERE name='SECRET_KEY'")
secret_key = cursor.fetchone()[0].encode('utf-8')

cursor.execute("SELECT value FROM keys WHERE name='SECURITY_PASSWORD_SALT'")
salt = cursor.fetchone()[0].encode('utf-8')

print("secret_key:", secret_key)
print("salt:", salt)

def decrypt_with_key(derived_key):
    # pad key
    key = derived_key[:32]
    if len(key) not in (16, 24, 32):
        key = key.ljust(32, b'}')
    cipher = Cipher(AES(key), CFB8(iv), default_backend())
    decryptor = cipher.encryptor() # wait, encryptor and decryptor are the same for CFB8 or we can use decryptor()
    # Actually CFB mode decryptor and encryptor logic:
    # let's try decryptor()
    decryptor = cipher.decryptor()
    res = decryptor.update(data) + decryptor.finalize()
    return res

# Try different PBKDF2 derivations
hash_names = ['sha256', 'sha512']
iterations_list = [1000, 10000, 25000, 100000]
dk_lens = [32, 64]

for hash_name in hash_names:
    for iterations in iterations_list:
        for dk_len in dk_lens:
            derived = hashlib.pbkdf2_hmac(hash_name, secret_key, salt, iterations, dk_len)
            dec = decrypt_with_key(derived)
            # check if dec is readable ascii
            try:
                dec_str = dec.decode('utf-8')
                if all(32 <= ord(c) < 127 for c in dec_str):
                    print(f"FOUND! hash={hash_name}, iter={iterations}, dklen={dk_len} => {dec_str}")
            except:
                pass
