# General Rules

- Selalu gunakan `crypto.randomUUID()` ketimbang `Date.now()` untuk men-generate ID database, terutama jika digunakan di dalam perulangan (bulk insert/looping), guna menghindari error UNIQUE constraint failed akibat waktu eksekusi yang bersamaan dalam hitungan milidetik.
