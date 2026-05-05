import ContentContainer from "@/components/ContentContainer";

export default function UeberUnsPage() {
  return (
    <ContentContainer>
      <article className="max-w-3xl space-y-10 text-zinc-700 dark:text-zinc-300">
        <header className="space-y-4">
          <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
            Über uns
          </h1>
          <p>
            Wir sind Ihr Ansprechpartner rund um Anhänger — vom kompakten
            PKW-Anhänger bis zu Speziallösungen für Boot, Pferd oder Maschinen.
          </p>
        </header>

        <section id="faq" className="scroll-mt-28 space-y-3">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Häufig gestellte Fragen
          </h2>
          <p>
            Inserate enthalten technische Angaben; auf der Detailseite können Sie
            Zubehör wählen und eine unverbindliche Anfrage senden. Wir melden
            uns bei Ihnen zu Verfügbarkeit und nächsten Schritten.
          </p>
        </section>

        <section id="registrierung" className="scroll-mt-28 space-y-3">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Anhänger registrieren
          </h2>
          <p>
            Haben Sie ein Fahrzeug erworben und möchten es dokumentieren oder
            verkaufen? Kontaktieren Sie uns — wir helfen bei der Darstellung im
            Marktplatz.
          </p>
        </section>

        <section id="haendler" className="scroll-mt-28 space-y-3">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Händler werden
          </h2>
          <p>
            Gewerbliche Anbieter können Inserate pflegen und Anfragen über das
            System entgegennehmen. Schreiben Sie uns für Zugang und Ablauf.
          </p>
        </section>

        <section id="kontakt" className="scroll-mt-28 space-y-3">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">
            Kontakt
          </h2>
          <p>
            Nutzen Sie die Anfragefunktion auf den Inseraten oder schreiben Sie
            uns mit Ihrem Anliegen — z. B. zu Verfügbarkeit, Ausstattung oder
            Händlerkooperation.
          </p>
        </section>
      </article>
    </ContentContainer>
  );
}
