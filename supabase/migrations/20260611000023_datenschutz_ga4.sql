update public.site_pages
set
  content = content || '
<h2 id="webanalyse">8. Webanalyse (Google Analytics 4)</h2>
<p>Wenn Sie im Cookie-Banner „Alle akzeptieren“ wählen, setzen wir Google Analytics 4 ein, einen Webanalysedienst der Google Ireland Limited (Gordon House, Barrow Street, Dublin 4, Irland) bzw. Google LLC (USA).</p>
<p><strong>Zweck:</strong> Reichweitenmessung und Analyse des Nutzungsverhaltens, um unser Angebot zu verbessern.</p>
<p><strong>Rechtsgrundlage:</strong> Art. 6 Abs. 1 lit. a DSGVO (Einwilligung). Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft widerrufen — über „Cookie-Einstellungen“ im Footer oder durch Löschen der gespeicherten Einwilligung im Browser.</p>
<p><strong>Verarbeitete Daten:</strong> u. a. gekürzte IP-Adresse, Seitenaufrufe, Verweildauer, Geräte- und Browserinformationen, ungefährer Standort (Land/Region). Die IP-Anonymisierung ist aktiviert.</p>
<p><strong>Speicherdauer:</strong> gemäß den Einstellungen in Google Analytics (standardmäßig begrenzte Aufbewahrungsfristen).</p>
<p><strong>Drittlandtransfer:</strong> Daten können in die USA übermittelt werden. Google stützt sich u. a. auf Standardvertragsklauseln der EU-Kommission.</p>
<p><strong>Widerspruch:</strong> Browser-Plugin zur Deaktivierung von Google Analytics: <a href="https://tools.google.com/dlpage/gaoptout" rel="noopener noreferrer" target="_blank">https://tools.google.com/dlpage/gaoptout</a></p>',
  updated_at = timezone('utc', now())
where slug = 'datenschutz'
  and content not like '%id="webanalyse"%';
