-- CreateTable
CREATE TABLE "admin" (
    "Id_admin" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "email" VARCHAR(100) NOT NULL,

    CONSTRAINT "admin_pkey" PRIMARY KEY ("Id_admin")
);

-- CreateTable
CREATE TABLE "masyarakat" (
    "id_masyarakat" SERIAL NOT NULL,
    "nama" TEXT NOT NULL,
    "nik" INTEGER NOT NULL,
    "no_hp" VARCHAR(15) NOT NULL,
    "alamat" VARCHAR(500) NOT NULL,

    CONSTRAINT "masyarakat_pkey" PRIMARY KEY ("id_masyarakat")
);

-- CreateTable
CREATE TABLE "pengaduan" (
    "id_pengaduan" SERIAL NOT NULL,
    "id_masyarakat" INTEGER NOT NULL,
    "deskripsi" VARCHAR(1000) NOT NULL,
    "lokasi" VARCHAR(1000) NOT NULL,
    "status" VARCHAR(100) NOT NULL,
    "response" TEXT,
    "createdAt" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pengaduan_pkey" PRIMARY KEY ("id_pengaduan")
);

-- CreateTable
CREATE TABLE "foto" (
    "id_foto" SERIAL NOT NULL,
    "id_pengaduan" INTEGER NOT NULL,
    "file" VARCHAR(1000) NOT NULL,
    "Waktu" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_pengirim" INTEGER NOT NULL,

    CONSTRAINT "foto_pkey" PRIMARY KEY ("id_foto")
);

-- CreateTable
CREATE TABLE "validasi" (
    "id_validasi" SERIAL NOT NULL,
    "id_pengaduan" INTEGER NOT NULL,
    "Id_admin" INTEGER NOT NULL,

    CONSTRAINT "validasi_pkey" PRIMARY KEY ("id_validasi")
);

-- CreateIndex
CREATE UNIQUE INDEX "id_masyarakat" ON "pengaduan"("id_masyarakat");

-- CreateIndex
CREATE INDEX "foto_ibfk_1" ON "foto"("id_pengaduan");

-- CreateIndex
CREATE INDEX "validasi_ibfk_2" ON "validasi"("id_pengaduan");

-- CreateIndex
CREATE INDEX "validasi_ibfk_4" ON "validasi"("Id_admin");

-- AddForeignKey
ALTER TABLE "pengaduan" ADD CONSTRAINT "pengaduan_ibfk_2" FOREIGN KEY ("id_masyarakat") REFERENCES "masyarakat"("id_masyarakat") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- AddForeignKey
ALTER TABLE "foto" ADD CONSTRAINT "foto_id_pengaduan_fkey" FOREIGN KEY ("id_pengaduan") REFERENCES "pengaduan"("id_pengaduan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validasi" ADD CONSTRAINT "validasi_id_pengaduan_fkey" FOREIGN KEY ("id_pengaduan") REFERENCES "pengaduan"("id_pengaduan") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "validasi" ADD CONSTRAINT "validasi_ibfk_3" FOREIGN KEY ("id_validasi") REFERENCES "admin"("Id_admin") ON DELETE RESTRICT ON UPDATE RESTRICT;
