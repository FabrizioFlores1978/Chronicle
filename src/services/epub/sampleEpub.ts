import JSZip from 'jszip';
import { parseEpub } from './epubParser';
import { EpubBook } from '../../types/epub';

/**
 * Creates a sample EPUB binary ("Alice's Adventures in Wonderland") and parses it into an EpubBook.
 */
export async function createSampleEpubBook(): Promise<EpubBook> {
  const zip = new JSZip();

  // 1. mimetype (Uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. container.xml
  zip.folder('META-INF')?.file(
    'container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // 3. Cover SVG as PNG/SVG
  const coverSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1e1b4b" />
      <stop offset="50%" stop-color="#312e81" />
      <stop offset="100%" stop-color="#0f172a" />
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="40%" r="50%">
      <stop offset="0%" stop-color="#818cf8" stop-opacity="0.4" />
      <stop offset="100%" stop-color="#818cf8" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="600" height="900" fill="url(#bg)"/>
  <circle cx="300" cy="380" r="240" fill="url(#glow)"/>
  
  <rect x="40" y="40" width="520" height="820" rx="16" fill="none" stroke="#6366f1" stroke-width="2" stroke-opacity="0.5" stroke-dasharray="8 6"/>
  <rect x="55" y="55" width="490" height="790" rx="12" fill="none" stroke="#a5b4fc" stroke-width="1" stroke-opacity="0.3"/>

  <!-- Title & Author -->
  <text x="300" y="220" font-family="'Georgia', serif" font-size="20" fill="#c7d2fe" font-weight="600" letter-spacing="4" text-anchor="middle">LEWIS CARROLL</text>
  <line x1="220" y1="245" x2="380" y2="245" stroke="#818cf8" stroke-width="2"/>
  
  <text x="300" y="340" font-family="'Georgia', serif" font-size="44" fill="#ffffff" font-weight="bold" text-anchor="middle">Alice's</text>
  <text x="300" y="400" font-family="'Georgia', serif" font-size="38" fill="#e0e7ff" font-weight="bold" text-anchor="middle">Adventures in</text>
  <text x="300" y="460" font-family="'Georgia', serif" font-size="46" fill="#a5b4fc" font-weight="bold" letter-spacing="1" text-anchor="middle">Wonderland</text>

  <!-- Illustration Icon / Pocket Watch Motif -->
  <circle cx="300" cy="580" r="50" fill="none" stroke="#fbbf24" stroke-width="4"/>
  <circle cx="300" cy="580" r="42" fill="#1e1b4b" stroke="#fef08a" stroke-width="1"/>
  <line x1="300" y1="580" x2="300" y2="550" stroke="#fbbf24" stroke-width="3" stroke-linecap="round"/>
  <line x1="300" y1="580" x2="325" y2="580" stroke="#fbbf24" stroke-width="2" stroke-linecap="round"/>
  <circle cx="300" cy="580" r="4" fill="#fbbf24"/>
  
  <text x="300" y="720" font-family="sans-serif" font-size="14" fill="#94a3b8" letter-spacing="3" text-anchor="middle">EPUB EDITOR EDITION</text>
  <text x="300" y="750" font-family="sans-serif" font-size="12" fill="#64748b" text-anchor="middle">Classic Literature Collection</text>
</svg>`;

  zip.folder('OEBPS')?.folder('Images')?.file('cover.svg', coverSvg);

  // 4. Stylesheet
  const css = `
body {
  font-family: 'Merriweather', Georgia, serif;
  line-height: 1.7;
  color: #1a1a1a;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  max-width: 42rem;
}
h1, h2, h3 {
  font-family: 'Outfit', -apple-system, sans-serif;
  color: inherit;
  margin-top: 1.8rem;
  margin-bottom: 0.8rem;
}
h1 {
  font-size: 2rem;
  border-bottom: 2px solid rgba(128, 128, 128, 0.2);
  padding-bottom: 0.5rem;
}
h2 {
  font-size: 1.4rem;
  color: inherit;
  opacity: 0.9;
}
p {
  margin: 1rem 0;
  text-align: justify;
}
blockquote {
  border-left: 4px solid #8b5cf6;
  padding-left: 1.2rem;
  margin: 1.5rem 0;
  color: #71717a;
  font-style: italic;
}
.center {
  text-align: center;
}
`;
  zip.folder('OEBPS')?.folder('Styles')?.file('style.css', css);

  // 5. Chapters
  const ch1 = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Chapter I: Down the Rabbit-Hole</title>
  <link rel="stylesheet" type="text/css" href="../Styles/style.css"/>
</head>
<body>
  <h1>CHAPTER I</h1>
  <h2>Down the Rabbit-Hole</h2>
  
  <p>Alice was beginning to get very tired of sitting by her sister on the bank, and of having nothing to do: once or twice she had peeped into the book her sister was reading, but it had no pictures or conversations in it, <em>"and what is the use of a book,"</em> thought Alice <em>"without pictures or conversations?"</em></p>
  
  <p>So she was considering in her own mind (as well as she could, for the hot day made her feel very sleepy and stupid), whether the pleasure of making a daisy-chain would be worth the trouble of getting up and picking the daisies, when suddenly a <strong><mark data-comment-id="comment-alice-1" class="author-comment-highlight" style="background-color: #fef08a; border-bottom: 2px solid #eab308; border-radius: 3px; padding: 0.08em 0.25em;">White Rabbit with pink eyes</mark></strong> ran close by her.</p>

  <blockquote>
    "Oh dear! Oh dear! I shall be late!"
  </blockquote>

  <p>There was nothing so <em>very</em> remarkable in that; nor did Alice think it so <em>very</em> much out of the way to hear the Rabbit say to itself, <em>"Oh dear! Oh dear! I shall be late!"</em> (when she thought it over afterwards, it occurred to her that she ought to have wondered at this, but at the time it all seemed quite natural); but when the Rabbit actually <strong><mark data-comment-id="comment-alice-2" class="author-comment-highlight" style="background-color: #bbf7d0; border-bottom: 2px solid #22c55e; border-radius: 3px; padding: 0.08em 0.25em;">took a watch out of its waistcoat-pocket</mark></strong>, and looked at it, and then hurried on, Alice started to her feet, for it flashed across her mind that she had never before seen a rabbit with either a waistcoat-pocket, or a watch to take out of it, and burning with curiosity, she ran across the field after it, and fortunately was just in time to see it pop down a large rabbit-hole under the hedge.</p>

  <h2>The Long Fall</h2>
  <p>In another moment down went Alice after it, never once considering how in the world she was to get out again.</p>
  <p>The rabbit-hole went straight on like a tunnel for some way, and then dipped suddenly down, so suddenly that Alice had not a moment to think about stopping herself before she found herself falling down a very deep well.</p>
</body>
</html>`;

  const ch2 = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Chapter II: The Pool of Tears</title>
  <link rel="stylesheet" type="text/css" href="../Styles/style.css"/>
</head>
<body>
  <h1>CHAPTER II</h1>
  <h2>The Pool of Tears</h2>
  
  <p><em>"Curiouser and curiouser!"</em> cried Alice (she was so much surprised, that for the moment she quite forgot how to speak good English); <em>"now I'm opening out like the largest telescope that ever was! Good-bye, feet!"</em> (for when she looked down at her feet, they seemed to be almost out of sight, they were getting so far off).</p>

  <p><em>"Oh, my poor little feet, I wonder who will put on your shoes and stockings for you now, dears? I'm sure I shan't be able! I shall be a great deal too far off to trouble myself about you: you must manage the best way you can; — but I must be kind to them,"</em> thought Alice, <em>"or perhaps they won't walk the way I want to go! Let me see: I'll give them a new pair of boots every Christmas."</em></p>

  <h2>Crying an Ocean</h2>
  <p>And she went on planning to herself how she would manage it. <em>"They must go by the carrier,"</em> she thought; <em>"and how funny it'll seem, sending presents to one's own feet! And how odd the directions will look!"</em></p>
  <p>Just then her head struck against the roof of the hall: in fact she was now more than nine feet high, and she at once took up the little golden key and hurried off to the garden door.</p>
</body>
</html>`;

  const ch3 = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Chapter III: A Caucus-Race and a Long Tale</title>
  <link rel="stylesheet" type="text/css" href="../Styles/style.css"/>
</head>
<body>
  <h1>CHAPTER III</h1>
  <h2>A Caucus-Race and a Long Tale</h2>
  
  <p>They were indeed a queer-looking party that assembled on the bank — the birds with draggled feathers, the animals with their fur clinging close to them, and all dripping wet, cross, and uncomfortable.</p>

  <p>The first question of course was, how to get dry again: they had a consultation about this, and after a few minutes it seemed quite natural to Alice to find herself talking familiarly with them, as if she had known them all her life.</p>

  <h2>The Dodo's Proposal</h2>
  <p><em>"What I was going to say,"</em> said the Dodo in an offended tone, <em>"was, that the best thing to get us dry would be a Caucus-race."</em></p>
  <p><em>"What is a Caucus-race?"</em> said Alice; not that she wanted much to know, but the Dodo had paused as if it thought that somebody ought to speak, and no one else seemed inclined to say anything.</p>
  <p><em>"Why,"</em> said the Dodo, <em>"the best way to explain it is to do it."</em></p>
</body>
</html>`;

  zip.folder('OEBPS')?.folder('Text')?.file('chapter1.xhtml', ch1);
  zip.folder('OEBPS')?.folder('Text')?.file('chapter2.xhtml', ch2);
  zip.folder('OEBPS')?.folder('Text')?.file('chapter3.xhtml', ch3);

  // 6. Nav (EPUB 3)
  const nav = `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <meta charset="utf-8"/>
  <title>Table of Contents</title>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="Text/chapter1.xhtml">Chapter I: Down the Rabbit-Hole</a></li>
      <li><a href="Text/chapter2.xhtml">Chapter II: The Pool of Tears</a></li>
      <li><a href="Text/chapter3.xhtml">Chapter III: A Caucus-Race and a Long Tale</a></li>
    </ol>
  </nav>
</body>
</html>`;
  zip.folder('OEBPS')?.file('nav.xhtml', nav);

  // 7. NCX (EPUB 2)
  const ncx = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:alice-in-wonderland-demo"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>Alice's Adventures in Wonderland</text>
  </docTitle>
  <navMap>
    <navPoint id="np-1" playOrder="1">
      <navLabel><text>Chapter I: Down the Rabbit-Hole</text></navLabel>
      <content src="Text/chapter1.xhtml"/>
    </navPoint>
    <navPoint id="np-2" playOrder="2">
      <navLabel><text>Chapter II: The Pool of Tears</text></navLabel>
      <content src="Text/chapter2.xhtml"/>
    </navPoint>
    <navPoint id="np-3" playOrder="3">
      <navLabel><text>Chapter III: A Caucus-Race and a Long Tale</text></navLabel>
      <content src="Text/chapter3.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;
  zip.folder('OEBPS')?.file('toc.ncx', ncx);

  // 8. OPF
  const opf = `<?xml version="1.0" encoding="utf-8"?>
<package version="3.0" unique-identifier="BookId" xmlns="http://www.idpf.org/2007/opf" xml:lang="en">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
    <dc:identifier id="BookId">urn:uuid:alice-in-wonderland-demo</dc:identifier>
    <dc:title>Alice's Adventures in Wonderland</dc:title>
    <dc:creator id="creator">Lewis Carroll</dc:creator>
    <dc:language>en</dc:language>
    <dc:publisher>Chronicle</dc:publisher>
    <dc:date>1865-11-26</dc:date>
    <dc:rights>Public Domain</dc:rights>
    <dc:description>The classic tale of Alice falling through a rabbit hole into a fantasy world populated by peculiar, anthropomorphic creatures.</dc:description>
    <dc:subject>Classics</dc:subject>
    <dc:subject>Fantasy</dc:subject>
    <dc:subject>Children's Literature</dc:subject>
    <meta property="dcterms:modified">2026-09-02T10:00:00Z</meta>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    <item id="cover-image" href="Images/cover.svg" media-type="image/svg+xml" properties="cover-image"/>
    <item id="style" href="Styles/style.css" media-type="text/css"/>
    <item id="chapter1" href="Text/chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="chapter2" href="Text/chapter2.xhtml" media-type="application/xhtml+xml"/>
    <item id="chapter3" href="Text/chapter3.xhtml" media-type="application/xhtml+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="chapter1"/>
    <itemref idref="chapter2"/>
    <itemref idref="chapter3"/>
  </spine>
  <guide>
    <reference type="cover" title="Cover" href="Images/cover.svg"/>
    <reference type="toc" title="Table of Contents" href="toc.ncx"/>
  </guide>
</package>`;
  zip.folder('OEBPS')?.file('content.opf', opf);

  const epubBlob = await zip.generateAsync({
    type: 'uint8array',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
  });

  const parsedBook = await parseEpub(epubBlob, "Alice's Adventures in Wonderland.epub");
  parsedBook.writerData = {
    comments: [
      {
        id: 'comment-alice-1',
        chapterId: 'chapter1',
        selectedText: 'White Rabbit with pink eyes',
        comment: 'Key inciting incident! Consider emphasizing the contrast between Alice’s drowsy boredom and this absurd creature.',
        color: '#fef08a',
        createdAt: '2026-09-08T10:15:00.000Z',
      },
      {
        id: 'comment-alice-2',
        chapterId: 'chapter1',
        selectedText: 'took a watch out of its waistcoat-pocket',
        comment: 'The watch is a key symbol representing adult Victorian anxiety over time, appointments, and punctuality.',
        color: '#bbf7d0',
        createdAt: '2026-09-08T10:20:00.000Z',
      },
    ],
    characters: [
      {
        id: 'char-alice',
        name: 'Alice',
        role: 'Protagonist',
        archetype: 'The Curious Explorer',
        age: '7',
        occupation: 'Victorian Schoolgirl',
        aliases: 'Mary Ann, The Little Girl',
        oneLineSummary: 'A polite, intensely curious girl who tumbles down a rabbit hole into a world of nonsense logic.',
        color: '#3b82f6',
        traits: [
          { id: 't1', text: 'Follow the White Rabbit down the rabbit hole', completed: true, category: 'goal' },
          { id: 't2', text: 'Drink from the bottle marked "DRINK ME"', completed: true, category: 'action' },
          { id: 't3', text: 'Maintain Victorian etiquette despite surreal insanity', completed: true, category: 'personality' },
          { id: 't4', text: 'Solve the Mad Hatter’s raven riddle', completed: false, category: 'goal' },
          { id: 't5', text: 'Stand up to the Queen of Hearts in the courtroom', completed: false, category: 'goal' },
        ],
        appearance: 'Neat pinafore dress over a sky-blue frock, white stockings, black Mary Jane shoes, and long golden-blonde hair held back by a headband.',
        personality: 'Inquisitive, logical to a fault, polite yet stubborn. Prone to reciting school lessons when flustered.',
        motivation: 'To find her way into the beautiful garden glimpsed through the tiny door, and ultimately return home.',
        backstory: 'Growing up in Victorian England, she finds her sister’s history book boring because it lacks pictures and conversations.',
        notes: 'Grows and shrinks repeatedly depending on what she eats or drinks. Represents childlike rationality confronting adult absurdity.',
      },
      {
        id: 'char-white-rabbit',
        name: 'The White Rabbit',
        role: 'Supporting',
        archetype: 'The Herald',
        age: 'Middle-aged',
        occupation: 'Royal Herald & Servant to the Queen',
        aliases: 'Mr. Rabbit',
        oneLineSummary: 'A nervous, time-obsessed rabbit in a waistcoat who catalyzes Alice’s journey.',
        color: '#eab308',
        traits: [
          { id: 'tr1', text: 'Check pocket watch anxiously', completed: true, category: 'habit' },
          { id: 'tr2', text: 'Mistake Alice for maidservant Mary Ann', completed: true, category: 'action' },
          { id: 'tr3', text: 'Deliver the royal summons for the croquet match', completed: false, category: 'goal' },
          { id: 'tr4', text: 'Sound trumpet herald at the trial of the Knave', completed: false, category: 'goal' },
        ],
        appearance: 'Fluffy white fur, pink eyes, crisp checked waistcoat, white kid gloves, and a brass pocket watch on a chain.',
        personality: 'Perpetually panicky, servile toward authority, fussy and easily startled by Alice’s size shifts.',
        motivation: 'Avoid being late for the Duchess and the wrath of the Queen of Hearts.',
        backstory: 'High-ranking court herald trusted with royal announcements and carrying the Queen’s fans.',
        notes: 'Catalyst character: his frantic sprint down the rabbit hole kicks off the entire adventure.',
      },
      {
        id: 'char-mad-hatter',
        name: 'The Mad Hatter',
        role: 'Supporting',
        archetype: 'The Trickster / Jester',
        age: 'Indeterminate',
        occupation: 'Milliner & Perpetual Tea Drinker',
        aliases: 'Hatter',
        oneLineSummary: 'An eccentric milliner trapped in permanent 6:00 tea time with the March Hare.',
        color: '#8b5cf6',
        traits: [
          { id: 'th1', text: 'Trap Time at 6 o’clock tea forever', completed: true, category: 'action' },
          { id: 'th2', text: 'Ask why a raven is like a writing-desk', completed: true, category: 'personality' },
          { id: 'th3', text: 'Switch places at the tea table to find clean cups', completed: false, category: 'habit' },
          { id: 'th4', text: 'Testify with teacup and bread-and-butter in hand at the trial', completed: false, category: 'goal' },
        ],
        appearance: 'Towering top hat with a 10/6 price tag tucked in the band, eccentric mismatched coat, bowtie, and tea crumbs.',
        personality: 'Riddling, argumentative, oblivious to social decorum, lives by unhinged wordplay and logic puzzles.',
        motivation: 'Stay on the good side of Time (with whom he had a falling out) and keep tea flowing.',
        backstory: 'Quarreled with Time at the Queen’s concert when singing "Twinkle, Twinkle, Little Bat". As punishment, Time stopped.',
        notes: 'Suffering from mercury toxicity (hatter’s disease). Iconic tea party chapter is a masterclass in absurdist dialogue.',
      },
      {
        id: 'char-queen-hearts',
        name: 'The Queen of Hearts',
        role: 'Antagonist',
        archetype: 'The Tyrant',
        age: 'Mature',
        occupation: 'Ruler of Wonderland',
        aliases: 'Her Royal Majesty',
        oneLineSummary: 'A furious, crimson monarch whose immediate solution to any grievance is decapitation.',
        color: '#ef4444',
        traits: [
          { id: 'tq1', text: 'Demand white roses be painted red', completed: true, category: 'action' },
          { id: 'tq2', text: 'Shout "Off with their heads!" at slightest offense', completed: true, category: 'habit' },
          { id: 'tq3', text: 'Play flamingo-and-hedgehog croquet game', completed: false, category: 'goal' },
          { id: 'tq4', text: 'Sentence the Knave before the verdict is given', completed: false, category: 'goal' },
        ],
        appearance: 'Voluminous red and black royal gown, gold crown perched precariously, brandishing a flaming croquet mallet or sceptre.',
        personality: 'Furious temper, tyrannical, domineering, irrational, easily flattered.',
        motivation: 'Enforce absolute control and punish any perceived insubordination across Wonderland.',
        backstory: 'Monarch alongside the meek King of Hearts; rules through theatrical terror though executioner rarely follows through.',
        notes: 'Climactic antagonist who orders Alice’s execution, prompting Alice’s awakening.',
      },
    ],
    locations: [],
    timelines: [
      {
        id: 'timeline-alice-main',
        title: 'Wonderland Narrative Arc',
        description: "Chronological sequence of Alice's whimsical encounters, transformations, and trials across Wonderland.",
        timescale: 'hours',
        color: '#8b5cf6',
        totalUnitsPerSegment: 24,
        unitStep: 2,
        segments: [
          {
            id: 'seg-alice-day-1',
            name: 'Day 1: Down the Rabbit Hole',
            startOffset: -18,
            zeroHour: 18,
            events: [
              {
                id: 'ev-alice-1',
                title: 'Down the Rabbit Hole',
                description: 'Alice follows the frantic White Rabbit and falls down the endless well of cupboards and bookshelves.',
                start: 10.0,
                duration: 2.0,
                color: '#3b82f6',
                lane: 0,
                characters: ['char-alice', 'char-white-rabbit'],
              },
              {
                id: 'ev-alice-2',
                title: "The Rabbit's Hurry",
                description: 'The White Rabbit checks his pocket watch and dashes away down the subterranean corridor.',
                start: 11.0,
                duration: 1.5,
                color: '#d89614',
                lane: 1,
                characters: ['char-white-rabbit'],
              },
              {
                id: 'ev-alice-3',
                title: 'Drink Me & Eat Me',
                description: 'Alice repeatedly shrinks and grows in the hallway of locked doors, leaving the golden key behind.',
                start: 12.5,
                duration: 2.5,
                color: '#8b5cf6',
                lane: 0,
                characters: ['char-alice'],
              },
              {
                id: 'ev-alice-4',
                title: 'Pool of Tears',
                description: 'Alice sheds a giant pool of tears at nine feet tall, then swims ashore alongside the Mouse and Dodo.',
                start: 14.5,
                duration: 3.0,
                color: '#3a6982',
                lane: 1,
                characters: ['char-alice'],
              },
              {
                id: 'ev-alice-5',
                title: 'The Caucus Race',
                description: 'The drenched animals hold a circular race to get dry, declaring everyone a winner with comfit prizes.',
                start: 17.0,
                duration: 2.5,
                color: '#009a34',
                lane: 0,
                characters: ['char-alice'],
              },
              {
                id: 'ev-alice-6',
                title: 'Advice from a Caterpillar',
                description: 'Perched upon a mushroom smoking hookah, the Caterpillar questions Alice\'s identity and explains height control.',
                start: 19.0,
                duration: 2.8,
                color: '#2d5a36',
                lane: 1,
                characters: ['char-alice'],
              },
            ],
          },
          {
            id: 'seg-alice-day-2',
            name: "Day 2: The Queen's Realm",
            startOffset: 6,
            zeroHour: -6,
            events: [
              {
                id: 'ev-alice-7',
                title: 'Pig and Pepper',
                description: "Alice visits the Duchess's kitchen, encounters the Cheshire Cat, and rescues the infant that turns into a pig.",
                start: 8.5,
                duration: 2.5,
                color: '#00ab2e',
                lane: 0,
                characters: ['char-alice'],
              },
              {
                id: 'ev-alice-8',
                title: 'A Mad Tea-Party',
                description: 'Trapped at permanent 6 o\'clock tea time, the Hatter, March Hare, and Dormouse bombard Alice with riddles.',
                start: 10.5,
                duration: 3.5,
                color: '#8b5cf6',
                lane: 1,
                characters: ['char-alice', 'char-mad-hatter'],
              },
              {
                id: 'ev-alice-9',
                title: 'Painting the Roses',
                description: 'Three card gardeners feverishly paint white roses crimson before the Queen of Hearts arrives.',
                start: 13.5,
                duration: 2.0,
                color: '#ff1721',
                lane: 0,
                characters: ['char-alice', 'char-white-rabbit'],
              },
              {
                id: 'ev-alice-10',
                title: "The Queen's Croquet",
                description: 'Royal croquet with flamingo mallets and hedgehog balls amid constant cries of "Off with their heads!".',
                start: 15.0,
                duration: 3.5,
                color: '#ef4444',
                lane: 1,
                characters: ['char-alice', 'char-queen-hearts', 'char-white-rabbit'],
              },
              {
                id: 'ev-alice-11',
                title: "The Mock Turtle's Story",
                description: 'The Gryphon escorts Alice to hear the melancholic Mock Turtle sing of the Lobster Quadrille.',
                start: 18.0,
                duration: 2.5,
                color: '#0055d4',
                lane: 0,
                characters: ['char-alice'],
              },
              {
                id: 'ev-alice-12',
                title: 'Trial of the Knave',
                description: "The court convenes over stolen tarts; Alice grows to full size, defies the Queen's cards, and awakens on the riverbank.",
                start: 20.0,
                duration: 3.0,
                color: '#7a1a1e',
                lane: 1,
                characters: ['char-alice', 'char-queen-hearts', 'char-mad-hatter', 'char-white-rabbit'],
              },
            ],
          },
        ],
      },
    ],
  };

  return parsedBook;
}

/**
 * Creates a pristine blank EPUB project ready for writing.
 */
export async function createNewBlankEpubBook(
  title: string = 'Untitled Manuscript',
  author: string = 'Author Name'
): Promise<EpubBook> {
  const zip = new JSZip();

  // 1. mimetype (Uncompressed)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. container.xml
  zip.folder('META-INF')?.file(
    'container.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`
  );

  // 3. Simple Cover SVG
  const coverSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 900" width="600" height="900">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0b0f19" />
      <stop offset="100%" stop-color="#1e1b4b" />
    </linearGradient>
  </defs>
  <rect width="600" height="900" fill="url(#bg)"/>
  <rect x="40" y="40" width="520" height="820" rx="8" fill="none" stroke="#6366f1" stroke-width="2" stroke-opacity="0.6"/>
  <text x="300" y="220" font-family="sans-serif" font-size="18" fill="#c7d2fe" font-weight="600" letter-spacing="4" text-anchor="middle">${author.toUpperCase()}</text>
  <line x1="220" y1="245" x2="380" y2="245" stroke="#818cf8" stroke-width="1.5"/>
  <text x="300" y="400" font-family="serif" font-size="40" fill="#ffffff" font-weight="bold" text-anchor="middle">${title}</text>
  <text x="300" y="750" font-family="sans-serif" font-size="13" fill="#818cf8" letter-spacing="3" text-anchor="middle">FIRST EDITION</text>
</svg>`;
  zip.folder('OEBPS')?.folder('Images')?.file('cover.svg', coverSvg);

  // 4. Stylesheet
  const css = `
body {
  font-family: 'Merriweather', Georgia, serif;
  line-height: 1.75;
  color: #1a1a1a;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  max-width: 44rem;
}
h1, h2, h3 {
  font-family: 'Outfit', sans-serif;
  color: #111827;
  margin-top: 2rem;
  margin-bottom: 1rem;
}
p {
  margin-bottom: 1.25rem;
  text-indent: 1.5rem;
}
p:first-of-type {
  text-indent: 0;
}
`;
  zip.folder('OEBPS')?.folder('Styles')?.file('style.css', css);

  // 5. Chapter 1
  const ch1 = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head>
  <title>Chapter 1</title>
  <link rel="stylesheet" type="text/css" href="../Styles/style.css"/>
</head>
<body>
  <section class="chapter">
    <h1>Chapter 1</h1>
    <p>Begin writing your story here. Use the formatting toolbar above to add headings, quotes, dialogue, and scenes.</p>
  </section>
</body>
</html>`;
  zip.folder('OEBPS')?.folder('Text')?.file('chapter1.xhtml', ch1);

  // 6. Navigation
  const nav = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en">
<head><title>Table of Contents</title></head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
      <li><a href="Text/chapter1.xhtml">Chapter 1</a></li>
    </ol>
  </nav>
</body>
</html>`;
  zip.folder('OEBPS')?.file('nav.xhtml', nav);

  const ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:new-manuscript"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle><text>${title}</text></docTitle>
  <navMap>
    <navPoint id="navpoint-1" playOrder="1">
      <navLabel><text>Chapter 1</text></navLabel>
      <content src="Text/chapter1.xhtml"/>
    </navPoint>
  </navMap>
</ncx>`;
  zip.folder('OEBPS')?.file('toc.ncx', ncx);

  // 7. OPF
  const opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="pub-id" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="pub-id">urn:uuid:new-manuscript</dc:identifier>
    <dc:title>${title}</dc:title>
    <dc:creator id="creator">${author}</dc:creator>
    <dc:language>en</dc:language>
    <dc:date>${new Date().toISOString().split('T')[0]}</dc:date>
    <meta property="dcterms:modified">${new Date().toISOString()}</meta>
    <meta name="cover" content="cover-image"/>
  </metadata>
  <manifest>
    <item id="cover-image" href="Images/cover.svg" media-type="image/svg+xml" properties="cover-image"/>
    <item id="style" href="Styles/style.css" media-type="text/css"/>
    <item id="chapter1" href="Text/chapter1.xhtml" media-type="application/xhtml+xml"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
  </manifest>
  <spine toc="ncx">
    <itemref idref="chapter1"/>
  </spine>
  <guide>
    <reference type="cover" title="Cover" href="Images/cover.svg"/>
    <reference type="toc" title="Table of Contents" href="toc.ncx"/>
  </guide>
</package>`;
  zip.folder('OEBPS')?.file('content.opf', opf);

  const epubBlob = await zip.generateAsync({
    type: 'uint8array',
    mimeType: 'application/epub+zip',
    compression: 'DEFLATE',
  });

  return await parseEpub(epubBlob, `${title}.epub`);
}
