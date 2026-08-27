import { Migration } from "@medusajs/framework/mikro-orm/migrations";
export class Migration20260827162422 extends Migration {
  override async up(): Promise<void> {
    this.addSql(`create table if not exists "colour_swatch" ("id" text not null, "name" text not null, "hex" text not null, "hex_secondary" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "colour_swatch_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_colour_swatch_deleted_at" ON "colour_swatch" ("deleted_at") WHERE deleted_at IS NULL;`);
  }
  override async down(): Promise<void> {
    this.addSql(`drop table if exists "colour_swatch" cascade;`);
  }
}
