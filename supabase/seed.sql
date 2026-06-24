-- Initial seed data for Souq Baghdad

insert into profiles (id, full_name, phone, role, avatar_url, created_at, ads_count, favorites_count, views_count)
values
('11111111-1111-1111-1111-111111111111', 'أحمد المشرف', '07701234567', 'admin', 'https://i.pravatar.cc/150?img=1', now(), 2, 5, 1200)
on conflict (id) do nothing;

insert into ads (id, seller_id, title, description, price, category, location, city, images, created_at, views, likes, status)
values
('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Mercedes AMG GT 2024 - فل كامل', 'سيارة فاخرة فل كامل مع ضمان خدمة مميزة.', '450,000,000 د.ع', 'cars', 'بغداد - المنصور', 'بغداد', array['https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=600'], now(), 1123, 120, 'active'),
('33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'شقة فاخرة 180م - زيونة', 'شقة مفروشة بالكامل وموقع ممتاز في زيونة.', '450,000,000 د.ع', 'real_estate', 'بغداد - زيونة', 'بغداد', array['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=600'], now(), 890, 78, 'active')
on conflict (id) do nothing;

insert into favorites (user_id, ad_id, created_at)
values
('11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', now()),
('11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', now())
on conflict do nothing;
