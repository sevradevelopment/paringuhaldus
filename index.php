<?php
declare(strict_types=1);
$year = (int) date('Y');
?>
<!DOCTYPE html>
<html lang="et">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Päringuhaldus.ee – Kõik kliendipäringud ühes kohas</title>
  <meta name="description" content="Halda hinnapäringuid, vastutajaid, pakkumisi ja järeltegevusi ilma Exceli ja segaste e-mailiketideta.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Manrope:wght@600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="assets/style.css">
</head>
<body id="top">
  <header class="site-header">
    <nav class="nav wrap">
      <a class="logo" href="#top">Päringuhaldus<span>.ee</span></a>
      <div class="nav-links" id="nav-links">
        <a href="#voimalused">Võimalused</a>
        <a href="#kuidas-tootab">Kuidas töötab</a>
        <a href="#hinnad">Hinnad</a>
        <a class="nav-login" href="#cta">Logi sisse</a>
        <a class="btn btn-primary btn-sm" href="#cta">Alusta tasuta</a>
      </div>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="nav-links" aria-label="Ava menüü">
        <span></span><span></span><span></span>
      </button>
    </nav>
  </header>

  <main>
    <section class="hero">
      <div class="wrap hero-grid">
        <div>
          <p class="brand-mark">Päringuhaldus<span>.ee</span></p>
          <h1>Kõik kliendipäringud ühes kohas.</h1>
          <p class="lead">Halda hinnapäringuid, vastutajaid, pakkumisi ja järeltegevusi ilma Exceli ja segaste e-mailiketideta.</p>
          <div class="hero-actions">
            <a class="btn btn-primary" href="#cta">Alusta tasuta</a>
            <a class="btn btn-ghost" href="#voimalused">Vaata võimalusi</a>
          </div>
          <p class="hero-note">Mõeldud müügitiimidele, teenusepakkujatele ja väikeettevõtetele, kes saavad päringuid e-posti, telefoni või veebivormi kaudu.</p>
        </div>
        <div class="preview" aria-hidden="true">
          <div class="preview-card">
            <div class="preview-head">
              <div>
                <p class="eyebrow">Tänased päringud</p>
                <p class="preview-title">Ülevaade</p>
              </div>
              <span class="badge">12 töös</span>
            </div>
            <div class="preview-list">
              <div class="preview-row">
                <div>
                  <strong>Nordic Steel OÜ</strong>
                  <span>Vastutaja: Mari</span>
                </div>
                <em class="tone-sky">Pakkumine saadetud</em>
              </div>
              <div class="preview-row">
                <div>
                  <strong>Tartu Remont AS</strong>
                  <span>Vastutaja: Jaan</span>
                </div>
                <em class="tone-amber">Follow-up</em>
              </div>
              <div class="preview-row">
                <div>
                  <strong>Baltic Logistics</strong>
                  <span>Vastutaja: Liis</span>
                </div>
                <em class="tone-green">Uus päring</em>
              </div>
            </div>
            <div class="preview-stats">
              <div><b>18</b><span>Avatud</span></div>
              <div><b>7</b><span>Võidetud</span></div>
              <div><b>3</b><span>Kaotatud</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">Teenus</p>
          <h2>Päringute haldus ei tohiks olla kaos</h2>
          <p>Kui kõik elab Excelis ja e-postis, kaob kontroll kiiresti – eriti kui meeskond kasvab.</p>
        </div>
        <div class="grid-3">
          <article class="card">
            <div class="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
            </div>
            <h3>Päringud kaovad e-mailidesse</h3>
            <p>Oluline info peitub lõpututes kirjavahetustes ning keegi ei tea, milline päring on juba vastatud.</p>
          </article>
          <article class="card">
            <div class="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            </div>
            <h3>Follow-up ununeb</h3>
            <p>Lubatud tagasihelistamised ja tähtajad jäävad meelde ainult peast – ja tihti liiga hilja.</p>
          </article>
          <article class="card">
            <div class="icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path stroke-linecap="round" stroke-linejoin="round" d="M9 17v-6m4 6V7m4 10v-3M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z"/></svg>
            </div>
            <h3>Puudub ülevaade</h3>
            <p>Juht ja müügitiim ei näe ühest kohast, mis staadiumis on iga pakkumine ja kus on riskid.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section section-alt" id="voimalused">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">Võimalused</p>
          <h2>Lihtne tööriist, mis hoiab päringud kontrolli all</h2>
          <p>Päringuhaldus.ee annab müügitiimile ühise vaate ja selge protsessi – ilma keeruka CRM-ita.</p>
        </div>
        <div class="grid-2">
          <article class="card feature">
            <span class="num">1</span>
            <div>
              <h3>Päringute haldus</h3>
              <p>Kogu kliendipäringud ühte kohta – allikas, sisu, failid ja ajalugu koos.</p>
            </div>
          </article>
          <article class="card feature">
            <span class="num">2</span>
            <div>
              <h3>Vastutajate määramine</h3>
              <p>Igal päringul on selge omanik. Keegi ei jää ootama ega unusta vastamist.</p>
            </div>
          </article>
          <article class="card feature">
            <span class="num">3</span>
            <div>
              <h3>Staatuste ja pakkumiste jälgimine</h3>
              <p>Näe kohe, kas päring on uus, töös, pakkumine saadetud, võidetud või kaotatud.</p>
            </div>
          </article>
          <article class="card feature">
            <span class="num">4</span>
            <div>
              <h3>Meeldetuletused ja järgmised tegevused</h3>
              <p>Planeeri follow-upid ja saa õigel ajal märku, et tehingud ei jahtu maha.</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <section class="section" id="kuidas-tootab">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">Kuidas töötab</p>
          <h2>Kolm sammu selgema müügiprotsessini</h2>
          <p>Ei ole vaja kuudepikkust juurutust – alusta kohe ja hoia fookus tehingutel.</p>
        </div>
        <div class="grid-3 steps">
          <article>
            <span class="step">01</span>
            <h3>Päring saabub</h3>
            <p>Lisa päring käsitsi või võta see vastu avaliku vormi kaudu – kõik jõuab ühte järjekorda.</p>
          </article>
          <article>
            <span class="step">02</span>
            <h3>Määrad vastutaja ja tegevuse</h3>
            <p>Vali, kes tegeleb, milline on järgmine samm ja millal tuleb klientiga uuesti ühendust võtta.</p>
          </article>
          <article>
            <span class="step">03</span>
            <h3>Jälgid kuni tehing on võidetud või kaotatud</h3>
            <p>Hoia staatust ajakohasena ja näe kogu meeskonnale, mis on töös ning mis on lõpetatud.</p>
          </article>
        </div>
      </div>
    </section>

    <section class="section section-alt" id="hinnad">
      <div class="wrap">
        <div class="section-head">
          <p class="eyebrow">Hinnad</p>
          <h2>Lihtsad paketid, selge väärtus</h2>
          <p>Alusta tasuta prooviga ja vali pakett, kui oled kindel.</p>
        </div>
        <div class="grid-3 pricing">
          <article class="card plan">
            <h3>Starter</h3>
            <p class="plan-desc">Väikestele tiimidele, kes tahavad päringud korrastada.</p>
            <p class="price">19 €<span>/kuu</span></p>
            <ul>
              <li>Kuni 2 kasutajat</li>
              <li>Päringute haldus</li>
              <li>Kliendihaldus</li>
              <li>Dashboard</li>
            </ul>
            <a class="btn btn-ghost" href="#cta">Alusta tasuta</a>
          </article>
          <article class="card plan featured">
            <span class="tag">Soovitatud</span>
            <h3>Business</h3>
            <p class="plan-desc">Kasvavatele ettevõtetele, kes vajavad ülevaadet ja rütmi.</p>
            <p class="price">39 €<span>/kuu</span></p>
            <ul>
              <li>Kuni 10 kasutajat</li>
              <li>Kõik Starter funktsioonid</li>
              <li>Avalik päringuvorm</li>
              <li>Meeldetuletused</li>
              <li>Statistika</li>
            </ul>
            <a class="btn btn-primary" href="#cta">Alusta tasuta</a>
          </article>
          <article class="card plan">
            <h3>Pro</h3>
            <p class="plan-desc">Suurematele meeskondadele ja tulevastele integratsioonidele.</p>
            <p class="price">79 €<span>/kuu</span></p>
            <ul>
              <li>Piiramatult kasutajaid</li>
              <li>Kõik Business funktsioonid</li>
              <li>Prioriteetne tugi</li>
              <li>Tulevased integratsioonid</li>
            </ul>
            <a class="btn btn-ghost" href="#cta">Alusta tasuta</a>
          </article>
        </div>
      </div>
    </section>

    <section class="section" id="cta">
      <div class="wrap">
        <div class="cta-box">
          <h2>Ära lase järgmisel päringul kaduma minna.</h2>
          <p>Proovi Päringuhaldus.ee tasuta ja too kõik kliendipäringud ühte selgesse vaatesse.</p>
          <a class="btn btn-light" href="#top">Alusta tasuta</a>
        </div>
      </div>
    </section>
  </main>

  <footer class="site-footer">
    <div class="wrap footer-top">
      <div>
        <a class="logo" href="#top">Päringuhaldus<span>.ee</span></a>
        <p>Eesti B2B tööriist hinnapäringute, pakkumiste ja järeltegevuste haldamiseks.</p>
      </div>
      <nav>
        <a href="#voimalused">Võimalused</a>
        <a href="#hinnad">Hinnad</a>
        <a href="#cta">Kontakt</a>
        <a href="#">Privaatsus</a>
        <a href="#">Kasutustingimused</a>
      </nav>
    </div>
    <div class="footer-bottom">
      <div class="wrap">
        <p>&copy; <?= $year ?> Päringuhaldus.ee. Kõik õigused kaitstud.</p>
      </div>
    </div>
  </footer>

  <script src="assets/app.js"></script>
</body>
</html>
