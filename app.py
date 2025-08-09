from flask import Flask, jsonify, request
from flask_cors import CORS
import sqlite3
from datetime import datetime
import pandas as pd
import logging

# Konfigurasi dasar
app = Flask(__name__)
DB_NAME = "database.db"
CORS(app) # Mengizinkan request dari frontend (Penting!)

# Konfigurasi logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s %(levelname)s: %(message)s',
                    datefmt='%Y-%m-%d %H:%M:%S')

# Fungsi untuk koneksi ke database
def get_db_connection():
    conn = sqlite3.connect(DB_NAME)
    conn.row_factory = sqlite3.Row
    return conn

# --- API Endpoints ---

@app.route('/api/devices', methods=['GET'])
def get_devices():
    keyword = request.args.get('q', '').lower()
    conn = get_db_connection()
    
    if keyword:
        query = "SELECT * FROM devices WHERE lower(name) LIKE ? OR lower(ip_address) LIKE ? OR lower(location) LIKE ? OR lower(status) LIKE ?"
        args = [f"%{keyword}%"] * 4
        devices_cursor = conn.execute(query, args).fetchall()
    else:
        devices_cursor = conn.execute("SELECT * FROM devices ORDER BY id").fetchall()
        
    devices = [dict(row) for row in devices_cursor]
    conn.close()
    return jsonify({"success": True, "devices": devices})

@app.route('/upload_excel', methods=['POST'])
def upload_excel():
    if 'file' not in request.files:
        return jsonify({"error": "Tidak ada file yang diunggah"}), 400
    
    file = request.files['file']
    if not file or not file.filename.endswith('.xlsx'):
        return jsonify({"error": "Format file tidak valid. Harap unggah file .xlsx"}), 400

    try:
        df = pd.read_excel(file, engine='openpyxl')
        required_columns = ['name', 'ip_address', 'location', 'status']
        if not all(col in df.columns for col in required_columns):
            return jsonify({"error": f"File Excel harus memiliki kolom: {', '.join(required_columns)}"}), 400

        conn = get_db_connection()
        cursor = conn.cursor()
        
        new_devices_count = 0
        skipped_count = 0
        for _, row in df.iterrows():
            try:
                detected_at = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                cursor.execute(
                    "INSERT INTO devices (name, ip_address, location, status, detected_at, latitude, longitude) VALUES (?, ?, ?, ?, ?, ?, ?)",
                    (row['name'], row['ip_address'], row['location'], row['status'], detected_at, row.get('latitude'), row.get('longitude'))
                )
                new_devices_count += 1
            except sqlite3.IntegrityError:
                skipped_count += 1
                logging.warning(f"IP duplikat dilewati: {row['ip_address']}")
                continue
        
        conn.commit()
        conn.close()
        
        message = f"{new_devices_count} perangkat berhasil diimpor."
        if skipped_count > 0:
            message += f" {skipped_count} perangkat dilewati karena IP sudah ada."
            
        logging.info(message)
        return jsonify({"message": message})

    except Exception as e:
        logging.error(f"Gagal memproses file Excel: {e}")
        return jsonify({"error": f"Terjadi kesalahan saat memproses file: {e}"}), 500

# Endpoint lain (add, edit, delete) akan ditangani oleh Next.js API Routes jika Anda mau,
# atau Anda bisa menambahkannya di sini dengan pola yang sama.

if __name__ == '__main__':
    # Pastikan database ada saat pertama kali dijalankan
    conn = sqlite3.connect(DB_NAME)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS devices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ip_address TEXT NOT NULL UNIQUE,
            location TEXT,
            status TEXT,
            detected_at TEXT,
            latitude REAL,
            longitude REAL
        )
    """)
    conn.close()
    app.run(debug=True, port=5000)