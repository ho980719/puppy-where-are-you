-- AlterTable
ALTER TABLE "tb_walk" ALTER COLUMN "path" DROP NOT NULL;

-- CreateTable
CREATE TABLE "tb_walk_point" (
    "id" TEXT NOT NULL,
    "walk_id" TEXT NOT NULL,
    "seq" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lng" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tb_walk_point_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tb_walk_point_walk_id_seq_idx" ON "tb_walk_point"("walk_id", "seq");

-- CreateIndex
CREATE UNIQUE INDEX "tb_walk_point_walk_id_seq_key" ON "tb_walk_point"("walk_id", "seq");

-- AddForeignKey
ALTER TABLE "tb_walk_point" ADD CONSTRAINT "tb_walk_point_walk_id_fkey" FOREIGN KEY ("walk_id") REFERENCES "tb_walk"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
