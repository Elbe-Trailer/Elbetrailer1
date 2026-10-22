-- Sicherheits-Härtung: zu weit gefasste öffentliche Policies entfernen.
--
-- 1. rental_bookings_public_read: RLS filtert Zeilen, nicht Spalten. Mit dem
--    öffentlichen anon-Key konnte jeder Name, E-Mail, Telefon und Nachricht
--    aller offenen/bestätigten Buchungen lesen (DSGVO-relevant). Die Website
--    liest die belegten Zeiträume jetzt serverseitig über den Service-Client
--    (src/lib/listings/rental-bookings.ts), nur Datumsspalten.
--
-- 2. inquiries_insert_public / contact_inquiries_insert_public: erlaubten
--    direkte Inserts über die REST-API an allen Prüfungen der Server Actions
--    vorbei (beliebiger Status, Größe, Zubehör-JSON). Beide Formulare schreiben
--    jetzt über den Service-Client, die öffentlichen Insert-Policies entfallen.
--
-- Erst anwenden, NACHDEM der zugehörige Code deployed ist.

drop policy if exists "rental_bookings_public_read" on public.rental_bookings;
drop policy if exists "inquiries_insert_public" on public.inquiries;
drop policy if exists "contact_inquiries_insert_public" on public.contact_inquiries;
