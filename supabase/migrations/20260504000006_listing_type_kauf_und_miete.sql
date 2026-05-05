do $$ begin
  alter type public.listing_type add value if not exists 'kauf_und_miete';
exception
  when duplicate_object then null;
end $$;
