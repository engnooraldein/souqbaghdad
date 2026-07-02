-- Create ad-images bucket
insert into storage.buckets (id, name, public) 
values ('ad-images', 'ad-images', true) 
on conflict (id) do nothing;

-- Drop existing policies if they exist (to allow re-running safely)
drop policy if exists "Public Access to ad-images" on storage.objects;
drop policy if exists "Authenticated upload to ad-images" on storage.objects;

-- Create policies
create policy "Public Access to ad-images" 
on storage.objects for select 
using (bucket_id = 'ad-images');

create policy "Authenticated upload to ad-images" 
on storage.objects for insert 
with check (bucket_id = 'ad-images' and auth.role() = 'authenticated');
