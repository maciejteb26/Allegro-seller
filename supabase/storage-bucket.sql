-- Uruchom w Supabase Dashboard → SQL Editor (jednorazowo)
-- Bucket na zdjęcia ofert (prywatny — backend serwuje presigned URL)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'szybkiewystawianie',
  'szybkiewystawianie',
  false,
  5242880,
  array['image/webp', 'image/jpeg', 'image/png', 'image/gif']
)
on conflict (id) do nothing;
