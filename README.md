### Aplikasi chat real-time menggunakan Node.js dan Socket.io

Aplikasi ini punya dua jenis chat, yaitu chat biasa dan chat rahasia yang sudah terenkripsi menggunakan RSA.
Di dalam sistem ini, setiap user akan memiliki public key masing-masing.
Pesan rahasia yang dikirim hanya bisa dibaca oleh user tujuan, jadi tidak semua orang bisa melihat isinya.
Aplikasi ini juga mendukung banyak client sekaligus.

Selain itu, saya juga membuat versi “server nakal” untuk simulasi, yang mencoba memodifikasi pesan agar bisa melihat bagaimana sistem tetap menjaga keamanannya.

Struktur project-nya seperti ini:
node-chat-app/
├── server.js # server normal
├── malicious-server.js # server yang memodifikasi pesan
├── client.js # client dengan RSA
├── package.json

Fitur chat:
• Chat biasa → semua user bisa kirim dan baca pesan
• Chat rahasia → pakai perintah !secret untuk kirim pesan terenkripsi
• Keluar dari mode rahasia → !exit
• Pesan rahasia hanya bisa dibaca oleh user yang dituju

Catatan keamanan:
• Setiap user punya key pair RSA sendiri
• Public key dikirim ke server
• Private key tetap disimpan di client
• Server tidak bisa membaca isi pesan rahasia

    Cara Menjalankan
    1. Install dependencies: npm install Jalankan 2. jalankan server
    - server normal: node server.js
    - server nakal: node malicious-server.js 3. 3. simulasi : node malicious-server.js
    4. Jalankan client di terminal lain: node client.js
