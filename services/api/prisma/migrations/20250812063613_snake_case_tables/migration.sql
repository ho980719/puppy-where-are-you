/*
  Warnings:

  - You are about to drop the `Place` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Walk` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_placeId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropForeignKey
ALTER TABLE "Walk" DROP CONSTRAINT "Walk_userId_fkey";

-- DropTable
DROP TABLE "Place";

-- DropTable
DROP TABLE "Review";

-- DropTable
DROP TABLE "User";

-- DropTable
DROP TABLE "Walk";

-- CreateTable
CREATE TABLE "tb_user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_place" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "tags" TEXT[],
    "is_pet_friendly" BOOLEAN NOT NULL DEFAULT false,
    "rating_avg" DOUBLE PRECISION,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_place_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_walk" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "start_at" TIMESTAMP(3) NOT NULL,
    "end_at" TIMESTAMP(3),
    "distance_meters" DOUBLE PRECISION,
    "duration_seconds" INTEGER,
    "path" JSONB NOT NULL,
    "photos" TEXT[],
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_walk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tb_review" (
    "id" TEXT NOT NULL,
    "place_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "photos" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tb_user_email_key" ON "tb_user"("email");

-- AddForeignKey
ALTER TABLE "tb_walk" ADD CONSTRAINT "tb_walk_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tb_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_review" ADD CONSTRAINT "tb_review_place_id_fkey" FOREIGN KEY ("place_id") REFERENCES "tb_place"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tb_review" ADD CONSTRAINT "tb_review_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "tb_user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
