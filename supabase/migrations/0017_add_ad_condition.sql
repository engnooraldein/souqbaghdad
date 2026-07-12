-- Add condition column to ads table
alter table ads add column if not exists condition text default 'used';
