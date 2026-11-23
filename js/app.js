(function () {
  'use strict';

  /* ---------- Store config (shared with unit tests, see js/pricing.js) ---------- */
  const { DELIVERY, SERVICE_FEE, FREE_DELIVERY_MIN, PRO_MONTHLY, ADDON_QTY, linePrice, computeTotals, formatPKR } = window.Pricing;

  const CATS = { women: "Women", men: "Men", makeup: "Beauty", grooming: "Grooming", shoes: "Shoes", accessories: "Accessories", tech: "Tech", decor: "Home Décor", fitness: "Fitness" };

  /* ---------- Product art (inline SVG, no network) ---------- */
  const ART = {
    lips: '<svg viewBox="0 0 200 200" aria-hidden="true"><g><rect x="42" y="105" width="30" height="58" rx="4" fill="#d9b26f"/><rect x="44" y="86" width="26" height="21" fill="#ecd29c"/><path d="M46 86V62l22-12v36z" fill="#9e1f3a"/></g><g><rect x="85" y="105" width="30" height="58" rx="4" fill="#d9b26f"/><rect x="87" y="86" width="26" height="21" fill="#ecd29c"/><path d="M89 86V62l22-12v36z" fill="#d94f6b"/></g><g><rect x="128" y="105" width="30" height="58" rx="4" fill="#d9b26f"/><rect x="130" y="86" width="26" height="21" fill="#ecd29c"/><path d="M132 86V62l22-12v36z" fill="#c4122f"/></g></svg>',
    blush: '<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="138" cy="140" r="26" fill="#f6b3a6" opacity=".7"/><rect x="66" y="74" width="44" height="96" rx="10" fill="#fff" stroke="#e7c3bb" stroke-width="3"/><rect x="66" y="74" width="44" height="22" rx="8" fill="#f08f7d"/><path d="M72 74c0-22 32-22 32 0z" fill="#f6a593"/><rect x="66" y="26" width="44" height="40" rx="10" fill="#fbd5cb" transform="rotate(-14 88 46)"/></svg>',
    jeans: '<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M70 36h60l6 37-10 55 22 44h-44l2-44-6-30-6 30 2 44H52l22-44-10-55z" fill="#5a7fb5"/><rect x="70" y="36" width="60" height="11" fill="#3f6296"/><path d="M100 47v48" stroke="#3f6296" stroke-width="2"/><path d="M78 60q8 10 18 6M122 60q-8 10-18 6" fill="none" stroke="#3f6296" stroke-width="2"/></svg>',
    cardigan: '<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M72 46l28 12 28-12 34 22-12 56-16-10v34H66v-34l-16 10-12-56z" fill="#f2cf6b"/><path d="M100 58v90" stroke="#cfa53d" stroke-width="3"/><path d="M80 120v28M90 120v28M110 120v28M120 120v28" stroke="#e0b951" stroke-width="2"/><g fill="#fffaf0" stroke="#d9c7a0"><circle cx="107" cy="76" r="4"/><circle cx="107" cy="96" r="4"/><circle cx="107" cy="116" r="4"/><circle cx="107" cy="136" r="4"/></g></svg>',
    clips: '<svg viewBox="0 0 200 200" aria-hidden="true">' + ['50 50', '106 50', '50 112', '106 112'].map((xy) =>
      '<g transform="translate(' + xy + ')"><rect x="0" y="0" width="44" height="16" rx="8" fill="#f3e9dc" stroke="#cdb89b" stroke-width="2"/><path d="M6 16v18M15 16v22M24 16v22M33 16v22M40 16v18" stroke="#cdb89b" stroke-width="4" stroke-linecap="round"/><circle cx="12" cy="8" r="4" fill="#fff"/><circle cx="22" cy="8" r="4" fill="#fff"/><circle cx="32" cy="8" r="4" fill="#fff"/></g>').join('') + '</svg>',
    bag: '<svg viewBox="0 0 200 200" aria-hidden="true"><path d="M62 100Q100 8 138 100" fill="none" stroke="#7a4b2a" stroke-width="5"/><rect x="48" y="94" width="104" height="74" rx="14" fill="#c97b4a"/><path d="M48 108a14 14 0 0 1 14-14h76a14 14 0 0 1 14 14v22q-52 24-104 0z" fill="#b0663a"/><circle cx="100" cy="134" r="6" fill="#f2d16b"/></svg>',
    mirror: '<svg viewBox="0 0 200 200" aria-hidden="true"><rect x="76" y="156" width="48" height="12" rx="6" fill="#d8c3a5"/><path d="M100 146v12" stroke="#d8c3a5" stroke-width="6"/><path d="M58 148a28 28 0 0 1 4-56 38 38 0 0 1 72-8 32 32 0 0 1 10 64z" fill="#fbf8f2" stroke="#e2d6c3" stroke-width="4"/><path d="M66 138a20 20 0 0 1 3-40 30 30 0 0 1 58-6 24 24 0 0 1 9 46z" fill="#d5e6f2"/><path d="M84 106l14-12M90 118l22-20" stroke="#fff" stroke-width="5" stroke-linecap="round"/></svg>',
    lamp: '<svg viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="84" r="50" fill="#fff3c4" opacity=".75"/><rect x="68" y="160" width="64" height="10" rx="5" fill="#d8c3a5"/><path d="M100 160v-52" stroke="#7fa37a" stroke-width="5"/><path d="M100 140q-20-4-26-20q18 0 26 14" fill="#8fb98a"/><path d="M72 64q0 46 28 46t28-46l-14 14-14-22-14 22z" fill="#f4a3b5"/></svg>'
  };

  /* Fallback art for products without a matching photo. */
  const PH_ART = Object.fromEntries(Object.entries({ women: "👗", men: "👕", makeup: "💄", grooming: "🧔", shoes: "👟", accessories: "🕶️", tech: "🎧", decor: "🕯️", fitness: "🏋️" }).map(([k, e]) => [k, '<svg viewBox="0 0 200 200" aria-hidden="true"><text x="100" y="124" text-anchor="middle" font-size="72">' + e + '</text></svg>']));

  const PRODUCTS = [
    { id: 'lip-kit', name: 'Velvet Matte Lip Kit (3 Shades)', cat: 'makeup', price: 1250, was: 3999, stock: 2, viewers: 14, bought: 230, rating: 4.4, reviews: 312, bg: '#fbe3e8', art: ART.lips, image: 'assets/lipstick.jpg',
      desc: 'Three long-wear matte liquid lipsticks in rosewood, berry and classic red. A lightweight, transfer-resistant formula that stays put for up to 8 hours.',
      bullets: ['3 × 3.5 ml liquid lipsticks', 'Transfer-resistant matte finish', 'Comes in a gift-ready box'], tags: 'lipstick lip makeup set red' },
    { id: 'blush', name: 'Dewy Glow Blush Stick', cat: 'makeup', price: 850, was: 2499, stock: 3, viewers: 9, bought: 184, rating: 4.3, reviews: 198, bg: '#fde8e1', art: ART.blush, image: 'assets/blush.jpg',
      desc: 'A creamy blush stick that blends with your fingertips for a fresh, dewy flush. Buildable colour in the shade "Peach Petal".',
      bullets: ['7 g twist-up stick', 'Cream-to-powder finish', 'For cheeks and lips'], tags: 'blush cheek makeup peach glow' },
    { id: 'jeans', name: 'High-Rise Flared Jeans', cat: 'women', price: 1950, was: 5999, stock: 2, viewers: 21, bought: 342, rating: 4.5, reviews: 527, bg: '#e3ebf6', art: ART.jeans, image: 'assets/jeans.jpg',
      desc: 'Retro-inspired flared jeans with a flattering high waist and soft stretch denim. A wardrobe staple that goes with everything.',
      bullets: ['Waist sizes 24–34', '98% cotton, 2% elastane', 'Mid-blue wash'], tags: 'jeans denim flare flared pants trousers' },
    { id: 'cardigan', name: 'Cropped Ribbed Cardigan', cat: 'women', price: 1650, was: 4499, stock: 4, viewers: 11, bought: 156, rating: 4.2, reviews: 143, bg: '#fbf1d9', art: ART.cardigan, image: 'assets/cropped%20cardigan.jpg',
      desc: 'A soft, cropped knit cardigan with pearl-style buttons. Layer it over dresses or tees for an easy, put-together look.',
      bullets: ['Sizes XS–L', 'Acrylic-blend rib knit', 'Colour: butter yellow'], tags: 'cardigan sweater knit top yellow' },
    { id: 'clips', name: 'Pearl Claw Clip Set (4 pcs)', cat: 'accessories', price: 550, was: 1799, stock: 2, viewers: 17, bought: 289, rating: 4.6, reviews: 401, bg: '#f1ece4', art: ART.clips, image: 'assets/pearl%20claw%20clip.jpg',
      desc: 'Four matte claw clips finished with faux-pearl details. A strong grip for thick or fine hair, in neutral tones that suit any outfit.',
      bullets: ['4 clips, 8 cm each', 'Faux-pearl accents', 'Includes a gift pouch'], tags: 'hair clip claw pearl accessory' },
    { id: 'bag', name: 'Mini Crossbody Bag', cat: 'accessories', price: 1800, was: 4999, stock: 3, viewers: 19, bought: 207, rating: 4.4, reviews: 265, bg: '#f6e6da', art: ART.bag, image: 'assets/crossbody%20bag.jpg',
      desc: 'A compact vegan-leather crossbody with an adjustable strap and gold-tone clasp. Fits a phone, cards and the essentials.',
      bullets: ['20 × 14 × 6 cm', 'Adjustable 120 cm strap', 'Vegan leather, tan'], tags: 'bag purse handbag crossbody leather' },
    { id: 'mirror', name: 'Cloud Desk Mirror', cat: 'decor', price: 1350, was: 3499, stock: 2, viewers: 12, bought: 173, rating: 4.3, reviews: 158, bg: '#e6f1f7', art: ART.mirror, image: 'assets/cloud%20desk%20mirror.jpg',
      desc: 'A dreamy cloud-shaped mirror on a stable base. Perfect for vanities, desks and shelf styling.',
      bullets: ['25 × 18 cm', 'Shatter-resistant acrylic mirror', 'Freestanding base'], tags: 'mirror cloud decor room vanity' },
    { id: 'lamp', name: 'Tulip Mood Lamp', cat: 'decor', price: 1450, was: 3999, stock: 3, viewers: 16, bought: 251, rating: 4.7, reviews: 389, bg: '#fdeef2', art: ART.lamp, image: 'assets/tulip%20mood%20lamp.jpg',
      desc: 'A soft-glow tulip lamp that adds warm, cosy light to any room. USB-powered with a touch dimmer.',
      bullets: ['USB-C powered, 1.5 m cable', '3-level touch dimmer', 'Height 28 cm'], tags: 'lamp light tulip decor room night' },
    { id: "slip-skirt", name: "Satin Midi Slip Skirt", cat: "women", price: 1450, was: 3999, stock: 3, viewers: 13, bought: 198, rating: 4.4, reviews: 241, bg: "#f3e6ee", art: PH_ART.women, image: "assets/satin%20midi%20skirt.jpg",
      desc: "A fluid satin midi skirt with an elasticated waist. Dress it up with heels or down with sneakers and an oversized tee.",
      bullets: ["Sizes XS–XL", "Satin-finish polyester", "Colour: champagne"], tags: "skirt satin slip midi women" },
    { id: "blazer", name: "Oversized Boyfriend Blazer", cat: "women", price: 2950, was: 7999, stock: 2, viewers: 18, bought: 264, rating: 4.5, reviews: 318, bg: "#ece7e1", art: PH_ART.women, image: "assets/boyfriend%20blazer.jpg",
      desc: "A relaxed, single-breasted blazer with padded shoulders. The easiest way to make jeans and a tee look polished.",
      bullets: ["Sizes XS–L", "Lined, two front pockets", "Colour: oatmeal"], tags: "blazer jacket oversized women work" },
    { id: "coord-set", name: "Ribbed Knit Co-ord Set", cat: "women", price: 2450, was: 6499, stock: 4, viewers: 10, bought: 147, rating: 4.3, reviews: 176, bg: "#e7eee9", art: PH_ART.women, image: "assets/knit%20co-ord%20set.jpg",
      desc: "A matching ribbed knit top and wide-leg trouser set. Comfortable enough for lounging, smart enough to go out.",
      bullets: ["Sizes XS–L", "Soft stretch rib knit", "Colour: sage green"], tags: "co-ord set matching knit loungewear women" },
    { id: "graphic-tee", name: "Oversized Graphic Tee", cat: "men", price: 990, was: 2799, stock: 3, viewers: 22, bought: 356, rating: 4.4, reviews: 489, bg: "#e9e9ea", art: PH_ART.men, image: "assets/graphic%20tee.jpg",
      desc: "A heavyweight cotton tee with a dropped shoulder and a retro back print. Boxy, oversized fit.",
      bullets: ["Sizes S–XXL", "240 gsm cotton", "Colour: washed black"], tags: "tshirt tee oversized graphic men streetwear" },
    { id: "cargo-pants", name: "Relaxed Cargo Pants", cat: "men", price: 2250, was: 5999, stock: 2, viewers: 19, bought: 287, rating: 4.5, reviews: 344, bg: "#e4e6dc", art: PH_ART.men, image: "assets/cargo%20pants.jpg",
      desc: "Utility-style cargo pants with a relaxed straight leg and adjustable ankle toggles. Six pockets for everything.",
      bullets: ["Waist 28–38", "Cotton twill", "Colour: olive"], tags: "cargo pants trousers utility men streetwear" },
    { id: "denim-jacket", name: "Washed Denim Jacket", cat: "men", price: 3450, was: 8999, stock: 3, viewers: 15, bought: 192, rating: 4.6, reviews: 233, bg: "#e1e7f0", art: PH_ART.men, image: "assets/denim%20jacket.jpg",
      desc: "A classic trucker-style denim jacket in a vintage light wash. Layers over hoodies and tees all year round.",
      bullets: ["Sizes S–XXL", "100% cotton denim", "Colour: light vintage wash"], tags: "denim jacket jean trucker men" },
    { id: "knit-polo", name: "Textured Knit Polo Shirt", cat: "men", price: 1750, was: 4499, stock: 4, viewers: 11, bought: 163, rating: 4.3, reviews: 187, bg: "#efe9df", art: PH_ART.men, image: "assets/knit%20polo%20shirt.jpg",
      desc: "A short-sleeve knitted polo with an open collar. Smart-casual and breathable for warm days.",
      bullets: ["Sizes S–XXL", "Breathable cotton knit", "Colour: cream"], tags: "polo shirt knit men smart casual" },
    { id: "zip-hoodie", name: "Heavyweight Zip Hoodie", cat: "men", price: 2650, was: 6999, stock: 2, viewers: 20, bought: 301, rating: 4.5, reviews: 402, bg: "#e6e4ea", art: PH_ART.men, image: "assets/zip%20hoodie.jpg",
      desc: "A thick brushed-fleece zip hoodie with a boxy fit and a double-layer hood.",
      bullets: ["Sizes S–XXL", "400 gsm cotton fleece", "Colour: charcoal"], tags: "hoodie zip sweatshirt men" },
    { id: "lip-oil", name: "Hydrating Lip Oil Duo", cat: "makeup", price: 950, was: 2699, stock: 3, viewers: 16, bought: 276, rating: 4.5, reviews: 331, bg: "#fbe6ea", art: PH_ART.makeup, image: "assets/lip%20oil%20duo.jpg",
      desc: "Two glossy, non-sticky lip oils that add a sheer tint and keep lips soft all day.",
      bullets: ["2 × 5 ml", "Shades: rose and clear", "Non-sticky formula"], tags: "lip oil gloss lips beauty" },
    { id: "snail-essence", name: "Snail Mucin Repair Essence", cat: "makeup", price: 1650, was: 4299, stock: 2, viewers: 14, bought: 239, rating: 4.6, reviews: 412, bg: "#eef3f6", art: PH_ART.makeup, image: "assets/snail%20mucin.jpg",
      desc: "A lightweight Korean-style essence that hydrates and soothes skin for a healthy glow.",
      bullets: ["100 ml", "For all skin types", "Fragrance-free"], tags: "skincare essence serum snail korean beauty" },
    { id: "vit-c-serum", name: "Vitamin C Glow Serum", cat: "makeup", price: 1350, was: 3699, stock: 4, viewers: 12, bought: 205, rating: 4.4, reviews: 266, bg: "#fdf0dd", art: PH_ART.makeup, image: "assets/vitamin%20c%20serum.jpg",
      desc: "A brightening vitamin C serum that evens skin tone and boosts radiance.",
      bullets: ["30 ml dropper bottle", "15% vitamin C", "Use in the morning"], tags: "serum vitamin c skincare glow beauty" },
    { id: "beard-kit", name: "Beard Grooming Kit", cat: "grooming", price: 1850, was: 4999, stock: 3, viewers: 13, bought: 221, rating: 4.5, reviews: 274, bg: "#ece4da", art: PH_ART.grooming, image: "assets/beard%20grooming%20kit.jpg",
      desc: "Everything for a well-kept beard: beard oil, balm, a wooden comb and a boar-bristle brush, in a gift box.",
      bullets: ["Beard oil 30 ml + balm 50 g", "Comb and brush included", "Sandalwood scent"], tags: "beard kit grooming oil men gift" },
    { id: "perfume-oud", name: "Woody Oud Eau de Parfum", cat: "grooming", price: 2450, was: 6999, stock: 2, viewers: 21, bought: 318, rating: 4.6, reviews: 377, bg: "#e8e1d6", art: PH_ART.grooming, image: "assets/woody%20oud.jpg",
      desc: "A warm, long-lasting fragrance with notes of oud, amber and cedarwood.",
      bullets: ["50 ml spray", "Eau de parfum, 8+ hours", "Gift-boxed"], tags: "perfume fragrance oud cologne men" },
    { id: "hair-clay", name: "Matte Hair Clay", cat: "grooming", price: 750, was: 1999, stock: 4, viewers: 9, bought: 167, rating: 4.3, reviews: 198, bg: "#e5e7e4", art: PH_ART.grooming, image: "assets/matte%20hair%20clay.jpg",
      desc: "A strong-hold, matte-finish styling clay for textured, natural-looking hair.",
      bullets: ["85 g tub", "Strong hold, matte finish", "Washes out easily"], tags: "hair clay wax styling men grooming" },
    { id: "trimmer", name: "Rechargeable Beard Trimmer", cat: "grooming", price: 2950, was: 7499, stock: 3, viewers: 17, bought: 246, rating: 4.4, reviews: 309, bg: "#e3e8ec", art: PH_ART.grooming, image: "assets/beard%20trimmer.jpg",
      desc: "A cordless trimmer with 20 length settings and a USB-C fast charge. For beard, stubble and line-ups.",
      bullets: ["20 length settings (0.5–10 mm)", "90 min battery, USB-C", "Washable blades"], tags: "trimmer shaver beard clipper men grooming" },
    { id: "chunky-sneakers", name: "Chunky White Sneakers", cat: "shoes", price: 3450, was: 8999, stock: 2, viewers: 24, bought: 389, rating: 4.5, reviews: 512, bg: "#eceef0", art: PH_ART.shoes, image: "assets/white%20sneakers.jpg",
      desc: "Clean white sneakers with a chunky platform sole. Go with jeans, cargos and dresses alike.",
      bullets: ["EU sizes 36–45", "Faux-leather upper", "Cushioned rubber sole"], tags: "sneakers shoes white chunky trainers" },
    { id: "court-sneakers", name: "Retro Court Sneakers", cat: "shoes", price: 2950, was: 7499, stock: 3, viewers: 15, bought: 228, rating: 4.4, reviews: 287, bg: "#eef0e8", art: PH_ART.shoes, image: "assets/retro%20court%20sneakers.jpg",
      desc: "Low-top retro court sneakers with a suede toe and a gum sole.",
      bullets: ["EU sizes 38–46", "Suede and leather upper", "Colour: off-white / green"], tags: "sneakers shoes retro court trainers men" },
    { id: "platform-slides", name: "Cloud Platform Slides", cat: "shoes", price: 1250, was: 3299, stock: 4, viewers: 12, bought: 274, rating: 4.3, reviews: 341, bg: "#f1ecf4", art: PH_ART.shoes,
      desc: "Super-soft, thick-soled slides that feel like walking on a cushion. Waterproof and easy to clean.",
      bullets: ["EU sizes 36–45", "Soft EVA foam", "Colour: lilac"], tags: "slides slippers sandals platform shoes" },
    { id: "chelsea-boots", name: "Suede Chelsea Boots", cat: "shoes", price: 4250, was: 10999, stock: 2, viewers: 14, bought: 158, rating: 4.6, reviews: 193, bg: "#ece3da", art: PH_ART.shoes, image: "assets/suede%20chelsea%20boots.jpg",
      desc: "Classic slip-on Chelsea boots in soft suede with elastic side panels and a chunky sole.",
      bullets: ["EU sizes 39–46", "Suede upper", "Colour: tan"], tags: "boots chelsea suede shoes men" },
    { id: "watch", name: "Minimalist Leather Watch", cat: "accessories", price: 2850, was: 7999, stock: 3, viewers: 18, bought: 213, rating: 4.5, reviews: 254, bg: "#ece6df", art: PH_ART.accessories, image: "assets/minimalist%20leather%20watch.jpg",
      desc: "A slim watch with a clean dial, a brown leather strap and a scratch-resistant face.",
      bullets: ["40 mm case", "Genuine leather strap", "Water-resistant 3 ATM"], tags: "watch wristwatch leather minimalist men" },
    { id: "sunglasses", name: "Retro Square Sunglasses", cat: "accessories", price: 1150, was: 3499, stock: 2, viewers: 20, bought: 297, rating: 4.3, reviews: 365, bg: "#efe9e2", art: PH_ART.accessories, image: "assets/Retro%20Square%20Sunglasses.jpg",
      desc: "Bold square frames with UV400 tinted lenses. A trendy finishing touch for any outfit.",
      bullets: ["UV400 protection", "Unisex fit", "Comes with a case"], tags: "sunglasses shades glasses retro" },
    { id: "card-wallet", name: "Slim Leather Card Wallet", cat: "accessories", price: 890, was: 2499, stock: 4, viewers: 10, bought: 184, rating: 4.4, reviews: 216, bg: "#e9e2da", art: PH_ART.accessories, image: "assets/Slim%20Leather%20Card%20Wallet.jpg",
      desc: "A slim card holder with RFID blocking. Holds up to 8 cards and folded notes.",
      bullets: ["Holds 8 cards", "RFID-blocking lining", "Genuine leather, black"], tags: "wallet card holder leather men" },
    { id: "bucket-hat", name: "Corduroy Bucket Hat", cat: "accessories", price: 690, was: 1899, stock: 3, viewers: 13, bought: 226, rating: 4.2, reviews: 251, bg: "#efe8dc", art: PH_ART.accessories, image: "assets/Corduroy%20Bucket%20Hat.jpg",
      desc: "A soft corduroy bucket hat with a relaxed brim. Easy streetwear styling for any season.",
      bullets: ["One size", "Corduroy cotton", "Colour: beige"], tags: "hat bucket cap corduroy streetwear" },
    { id: "earbuds", name: "Wireless Noise-Cancelling Earbuds", cat: "tech", price: 4450, was: 11999, stock: 2, viewers: 25, bought: 412, rating: 4.5, reviews: 588, bg: "#e6eaf0", art: PH_ART.tech, image: "assets/Wireless%20Noise-Cancelling%20Earbuds.jpg",
      desc: "True wireless earbuds with active noise cancelling, touch controls and a pocket-size charging case.",
      bullets: ["Up to 30 h with case", "Active noise cancelling", "Bluetooth 5.3"], tags: "earbuds earphones headphones wireless audio tech" },
    { id: "instant-camera", name: "Mini Instant Film Camera", cat: "tech", price: 4950, was: 12999, stock: 3, viewers: 19, bought: 238, rating: 4.6, reviews: 297, bg: "#eef2ec", art: PH_ART.tech, image: "assets/Mini%20Instant%20Film%20Camera.jpg",
      desc: "A cute, compact instant camera that prints credit-card-sized photos in seconds.",
      bullets: ["Built-in flash, selfie mirror", "Uses mini instant film", "Colour: pastel blue"], tags: "camera instant film photo polaroid tech" },
    { id: "keyboard", name: "RGB Mechanical Keyboard", cat: "tech", price: 3950, was: 9999, stock: 2, viewers: 17, bought: 264, rating: 4.5, reviews: 321, bg: "#e5e6ea", art: PH_ART.tech, image: "assets/rgb%20mechanical%20keyboard.png",
      desc: "A compact 75% mechanical keyboard with hot-swappable switches and customisable RGB lighting.",
      bullets: ["75% layout, 84 keys", "Hot-swappable switches", "USB-C wired"], tags: "keyboard mechanical rgb gaming tech" },
    { id: "speaker", name: "Portable Bluetooth Speaker", cat: "tech", price: 2950, was: 7999, stock: 4, viewers: 14, bought: 302, rating: 4.4, reviews: 376, bg: "#e8ecef", art: PH_ART.tech, image: "assets/portable%20bluetooth%20speaker.jpg",
      desc: "A rugged, waterproof speaker with punchy bass and a 12-hour battery.",
      bullets: ["IPX7 waterproof", "12 h battery", "Bluetooth 5.0"], tags: "speaker bluetooth portable audio music tech" },
    { id: "power-bank", name: "Magnetic Wireless Power Bank", cat: "tech", price: 2450, was: 5999, stock: 3, viewers: 16, bought: 271, rating: 4.3, reviews: 318, bg: "#eceaf0", art: PH_ART.tech, image: "assets/magnetic%20wireless%20power%20bank.jpg",
      desc: "A slim 10,000 mAh power bank that snaps magnetically to the back of your phone.",
      bullets: ["10,000 mAh", "Magnetic wireless + USB-C", "Fast charging"], tags: "power bank charger battery wireless tech" },
    { id: "smartwatch", name: "Fitness Smartwatch", cat: "tech", price: 4750, was: 12499, stock: 2, viewers: 22, bought: 335, rating: 4.4, reviews: 421, bg: "#e4ebe9", art: PH_ART.tech, image: "assets/fitness%20smart%20watch.jpg",
      desc: "Tracks steps, heart rate, sleep and workouts, with message notifications and a 7-day battery.",
      bullets: ["1.8\" AMOLED display", "7-day battery", "Water-resistant"], tags: "smartwatch watch fitness tracker tech" },
    { id: "sunset-lamp", name: "Sunset Projection Lamp", cat: "decor", price: 1650, was: 4499, stock: 3, viewers: 18, bought: 312, rating: 4.5, reviews: 397, bg: "#fbe9dc", art: PH_ART.decor, image: "assets/sunset%20projection%20lamp.jpg",
      desc: "Projects a warm, golden sunset glow onto your wall. A favourite for cosy rooms and photos.",
      bullets: ["USB powered", "180° rotating head", "16 colour modes + remote"], tags: "lamp sunset projector light decor room" },
    { id: "candle-set", name: "Scented Soy Candle Set (3)", cat: "decor", price: 1450, was: 3999, stock: 4, viewers: 11, bought: 189, rating: 4.6, reviews: 228, bg: "#f4ede3", art: PH_ART.decor, image: "assets/scented%20soy%20candle%20set%20(3).png",
      desc: "Three hand-poured soy candles in amber glass jars: vanilla, sandalwood and fresh linen.",
      bullets: ["3 × 150 g candles", "30 h burn time each", "Natural soy wax"], tags: "candles scented soy decor gift" },
    { id: "galaxy-projector", name: "Astronaut Galaxy Projector", cat: "decor", price: 2950, was: 7499, stock: 2, viewers: 20, bought: 276, rating: 4.4, reviews: 336, bg: "#e6e6f2", art: PH_ART.decor, image: "assets/astronaut%20galaxy%20projector.jpg",
      desc: "An astronaut-shaped night light that projects a moving galaxy and stars across your ceiling.",
      bullets: ["Remote control + timer", "Adjustable head", "USB powered"], tags: "galaxy projector star night light astronaut decor room" },
    { id: "tumbler", name: "Insulated Tumbler with Handle (1.2 L)", cat: "fitness", price: 1950, was: 4999, stock: 3, viewers: 23, bought: 398, rating: 4.6, reviews: 507, bg: "#e3eeec", art: PH_ART.fitness, image: "assets/insulated%20tumbler%20with%20handle%201.2%20litre.jpg",
      desc: "A big stainless-steel tumbler that keeps drinks cold for 24 hours. Fits in car cup holders.",
      bullets: ["1.2 L capacity", "Cold 24 h, hot 8 h", "Leak-resistant lid + straw"], tags: "tumbler bottle cup water insulated fitness" },
    { id: "dumbbells", name: "Adjustable Dumbbell Set (20 kg)", cat: "fitness", price: 4950, was: 11999, stock: 2, viewers: 15, bought: 174, rating: 4.5, reviews: 203, bg: "#e5e7ea", art: PH_ART.fitness, image: "assets/adjustable%20dumbell%20set%20(20%20kg).jpg",
      desc: "A pair of adjustable dumbbells with spin-lock collars. Build a home gym without the clutter.",
      bullets: ["2 × 10 kg, adjustable", "Anti-slip grip", "Includes storage case"], tags: "dumbbells weights gym fitness men" },
    { id: "yoga-mat", name: "Non-Slip Yoga Mat", cat: "fitness", price: 1450, was: 3799, stock: 4, viewers: 12, bought: 233, rating: 4.4, reviews: 285, bg: "#eef0e6", art: PH_ART.fitness, image: "assets/non%20slip%20yoga%20mat.jpg",
      desc: "A thick, cushioned yoga mat with a non-slip texture and a carry strap.",
      bullets: ["183 × 61 cm, 8 mm thick", "Non-slip TPE", "Carry strap included"], tags: "yoga mat exercise pilates fitness" },
    { id: "gym-duffel", name: "Gym Duffel Bag", cat: "fitness", price: 2250, was: 5999, stock: 3, viewers: 16, bought: 207, rating: 4.5, reviews: 248, bg: "#e7e6e4", art: PH_ART.fitness, image: "assets/gym%20duffel%20bag.jpg",
      desc: "A water-resistant gym bag with a separate shoe compartment and a padded shoulder strap.",
      bullets: ["40 L capacity", "Separate shoe pocket", "Water-resistant"], tags: "gym bag duffel sports fitness travel" }
  ];

  /* ---------- Helpers ---------- */
  const $ = (s) => document.querySelector(s);
  const $$ = (s) => Array.from(document.querySelectorAll(s));
  const pkr = formatPKR;
  const product = (id) => PRODUCTS.find((p) => p.id === id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  // The drawn art sits underneath; if the photo file is missing, the <img> removes itself and the art shows.
  const productArtwork = (p) => p.image
    ? p.art + '<img class="product-image" src="' + esc(p.image) + '" alt="' + esc(p.name) + '" onerror="this.remove()">'
    : p.art;
  const stars = (r) => '★'.repeat(Math.round(r)) + '☆'.repeat(5 - Math.round(r)) + ' <span>' + r.toFixed(1) + '</span>';

  const state = { cart: [], view: 'home', current: null, cat: 'all', q: '', step: 1 };

  /* ---------- Pricing ---------- */
  function selectedPlan() {
    const r = document.querySelector('input[name="plan"]:checked');
    return r ? r.value : 'once';
  }
  // stage: 0 = cart, 1-4 = checkout steps. Plan applies from the payment step, add-on from review.
  function totals(stage) {
    const lines = state.cart.map((c) => Object.assign({}, product(c.id), { qty: c.qty }));
    if (stage >= 4 && $('#addon-check').checked && lines.length) {
      lines[0] = Object.assign({}, lines[0], { qty: lines[0].qty + ADDON_QTY, addon: true });
    }
    return computeTotals(lines, { pro: stage >= 2 && selectedPlan() === 'pro' });
  }
  function addonCost() {
    const first = state.cart[0];
    if (!first) return 0;
    const p = product(first.id);
    return linePrice(p.price, first.qty + ADDON_QTY) - linePrice(p.price, first.qty);
  }
  const row = (label, value, cls) => '<div class="sum-row ' + (cls || '') + '"><span>' + label + '</span><span>' + value + '</span></div>';

  function renderSummary(el, stage) {
    const t = totals(stage);
    let html = '';
    if (stage >= 1) {
      html += '<div class="sum-items">' + t.lines.map((l) =>
        '<div class="sum-item"><span>' + l.qty + ' × ' + esc(l.name) + (l.addon ? ' (incl. add-on)' : '') + '</span><span>' + pkr(linePrice(l.price, l.qty)) + '</span></div>').join('') + '</div>';
    }
    html += row('Items (' + t.count + ')', pkr(t.gross));
    if (t.bundle) html += row('Buy 2 Get 1 Free', '−' + pkr(t.bundle), 'save');
    if (t.proDiscount) html += row('PakienPro 10% off', '−' + pkr(t.proDiscount), 'save');
    html += row('Delivery', t.delivery ? pkr(t.delivery) : 'Free');
    html += row('Service fee', pkr(t.fee));
    html += row('Order total', pkr(t.total), 'total');
    el.innerHTML = html;
  }

  function renderThreshold(el) {
    const sub = totals(0).subtotal;
    const left = Math.max(0, FREE_DELIVERY_MIN - sub);
    el.innerHTML = 'Free delivery on orders over ' + pkr(FREE_DELIVERY_MIN) + '.' + (left ? '' : ' This order qualifies.');
  }

  /* ---------- Cart ---------- */
  function addToCart(id, qty) {
    const line = state.cart.find((c) => c.id === id);
    if (line) line.qty += qty; else state.cart.push({ id, qty });
    updateCount();
  }
  function setQty(id, qty) {
    if (qty <= 0) state.cart = state.cart.filter((c) => c.id !== id);
    else state.cart.find((c) => c.id === id).qty = qty;
    updateCount();
    renderCart();
  }
  function updateCount() {
    $('#cart-count').textContent = state.cart.reduce((a, c) => a + c.qty, 0);
  }

  function renderCart() {
    const box = $('#cart-items');
    if (!state.cart.length) {
      box.innerHTML = '<div class="empty-cart"><p>Your cart is empty.</p><button class="btn btn-primary" data-go="home">Start shopping</button></div>';
    } else {
      box.innerHTML = state.cart.map((c) => {
        const p = product(c.id);
        const free = Math.floor(c.qty / 3);
        return `
        <div class="line">
          <div class="line-img">${productArtwork(p)}</div>
          <div class="line-info">
            <h3>${esc(p.name)}</h3>
            <p class="line-cat">${CATS[p.cat]}</p>
            <div class="line-price">${pkr(p.price)} each
            </div>
            ${free ? `<p class="line-free">Buy 2 Get 1 Free: ${free} free</p>` : ''}
            <div class="qty">
              <button data-dec="${p.id}" aria-label="Decrease quantity">−</button>
              <span>${c.qty}</span>
              <button data-inc="${p.id}" aria-label="Increase quantity">+</button>
              <button class="link" data-remove="${p.id}">Remove</button>
            </div>
          </div>
          <div class="line-total">${pkr(linePrice(p.price, c.qty))}</div>
        </div>`;
      }).join('');
    }
    $('#to-checkout').disabled = !state.cart.length;
    renderSummary($('#cart-summary'), 0);
    renderThreshold($('#cart-threshold'));
  }

  /* ---------- Grid ---------- */
  function cardHTML(p) {
    return `
    <article class="card" data-id="${p.id}" tabindex="0" role="button" aria-label="${esc(p.name)}">
      <div class="card-img">${productArtwork(p)}
      </div>
      <div class="card-body">
        <h3>${esc(p.name)}</h3>
        <div class="rating">${stars(p.rating)} <span>(${p.reviews})</span></div>
        <div class="price-row">
          <span class="price">${pkr(p.price)}</span>
        </div>
        <div class="fees-note">+ ${pkr(DELIVERY)} delivery + ${pkr(SERVICE_FEE)} service fee per order</div>
      </div>
    </article>`;
  }

  function renderGrid() {
    const q = state.q.trim().toLowerCase();
    const list = PRODUCTS.filter((p) =>
      (state.cat === 'all' || p.cat === state.cat) &&
      (!q || (p.name + ' ' + CATS[p.cat] + ' ' + p.tags).toLowerCase().includes(q)));
    $('#grid').innerHTML = list.map(cardHTML).join('');
    $('#grid-empty').hidden = list.length > 0;
    $('#grid-count').textContent = list.length + (list.length === 1 ? ' item' : ' items');
    $('#grid-title').textContent = q ? 'Results for "' + state.q.trim() + '"' : (state.cat === 'all' ? 'Gift ideas for you' : CATS[state.cat]);
    $('#clear-filter').hidden = !q && state.cat === 'all';
    $$('nav.cats button').forEach((b) => b.classList.toggle('active', b.dataset.cat === state.cat));
  }

  /* ---------- Views ---------- */
  function showView(name) {
    $$('.view').forEach((v) => v.classList.remove('shown', 'visible'));
    const v = $('#view-' + name);
    v.classList.add('shown');
    requestAnimationFrame(() => requestAnimationFrame(() => v.classList.add('visible')));
    state.view = name;
    if (name === 'cart') renderCart();
    window.scrollTo(0, 0);
  }
  function goHome(scrollToGrid) {
    showView('home');
    if (scrollToGrid) $('#grid-anchor').scrollIntoView({ behavior: 'smooth' });
  }

  /* ---------- Product detail ---------- */
  function openProduct(id) {
    const p = product(id);
    state.current = id;
    $('#pd-img').innerHTML = productArtwork(p);
    $('#pd-cat').textContent = CATS[p.cat];
    $('#pd-name').textContent = p.name;
    $('#pd-rating').innerHTML = stars(p.rating) + ' <span>(' + p.reviews + ' ratings)</span>';
    $('#pd-price').textContent = pkr(p.price);
    $('#pd-fees').textContent = '+ ' + pkr(DELIVERY) + ' delivery and ' + pkr(SERVICE_FEE) + ' service fee per order. Delivery is free on orders over ' + pkr(FREE_DELIVERY_MIN) + '.';
    $('#pd-desc').textContent = p.desc;
    $('#pd-bullets').innerHTML = p.bullets.map((b) => '<li>' + esc(b) + '</li>').join('');
    showView('product');
  }

  /* ---------- Add-to-cart modal ---------- */
  function openModal(p) {
    $('#atc-thumb').innerHTML = productArtwork(p);
    $('#atc-name').textContent = p.name;
    const q = state.cart.find((c) => c.id === p.id).qty;
    $('#offer-cost').textContent = pkr(linePrice(p.price, q + ADDON_QTY) - linePrice(p.price, q));
    renderThreshold($('#atc-threshold'));
    $('#atc-modal').hidden = false;
  }
  function closeModal() { $('#atc-modal').hidden = true; }

  let toastId = null;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('on');
    clearTimeout(toastId);
    toastId = setTimeout(() => t.classList.remove('on'), 2200);
  }

  /* ---------- Checkout ---------- */
  function goStep(n) {
    state.step = n;
    $$('.step').forEach((f) => { f.hidden = Number(f.dataset.step) !== n; });
    $$('#steps li').forEach((li) => {
      const s = Number(li.dataset.step);
      li.classList.toggle('done', s < n);
      li.classList.toggle('current', s === n);
    });
    if (n === 4) renderReview();
    renderSummary($('#checkout-summary'), n);
    window.scrollTo(0, 0);
  }

  function planLabel() {
    return selectedPlan() === 'pro' ? 'PakienPro: free for 7 days, then ' + pkr(PRO_MONTHLY) + '/month until cancelled' : 'One-time purchase';
  }

  function renderReview() {
    const s = $('#step-1').elements;
    const pay = $('#step-2').elements;
    const name = s.name.value.trim() || 'Customer';
    const addr = s.address.value.trim();
    $('#rv-ship').innerHTML = esc(name) + '<br>' + (addr ? esc(addr) + ', ' : '') + esc(s.city.value);
    const digits = pay.card.value.replace(/\D/g, '');
    $('#rv-pay').textContent = pay.pay.value === 'cod' ? 'Cash on delivery' : 'Card' + (digits.length >= 4 ? ' ending ' + digits.slice(-4) : '');
    $('#rv-plan').textContent = planLabel();
    const first = state.cart[0] && product(state.cart[0].id);
    $('#addon-label').textContent = first
      ? ADDON_QTY + ' more × ' + first.name + ' (Buy 2 Get 1 Free) +' + pkr(addonCost())
      : '';
  }

  function placeOrder() {
    const t = totals(4);
    const id = 'PK-' + Math.floor(100000 + Math.random() * 900000);
    $('#cf-id').textContent = id;
    $('#cf-details').innerHTML =
      t.lines.map((l) => row(l.qty + ' × ' + esc(l.name), pkr(linePrice(l.price, l.qty)))).join('') +
      row('Purchase type', esc(planLabel())) +
      row('Ship to', $('#rv-ship').innerHTML) +
      row('Total paid', pkr(t.total), 'total');
    state.cart = [];
    updateCount();
    resetForms();
    showView('confirm');
  }

  function resetForms() {
    $$('form.step').forEach((f) => f.reset());
    $('#card-fields').hidden = false;
  }


  /* ---------- Events ---------- */
  document.addEventListener('submit', (e) => {
    e.preventDefault();
    const f = e.target;
    if (f.id === 'search-form') {
      state.q = $('#search-input').value;
      state.cat = 'all';
      renderGrid();
      goHome(true);
    } else if (f.classList.contains('step')) {
      const n = Number(f.dataset.step);
      if (n < 4) goStep(n + 1); else placeOrder();
    }
  });

  document.addEventListener('click', (e) => {
    const el = e.target.closest('button, .card');
    if (!el) return;
    if (el.classList.contains('card')) return openProduct(el.dataset.id);
    if (el.dataset.go) return goHome(false);
    if (el.dataset.cat) {
      state.cat = el.dataset.cat;
      state.q = '';
      $('#search-input').value = '';
      renderGrid();
      return goHome(true);
    }
    if (el.dataset.inc) return setQty(el.dataset.inc, state.cart.find((c) => c.id === el.dataset.inc).qty + 1);
    if (el.dataset.dec) return setQty(el.dataset.dec, state.cart.find((c) => c.id === el.dataset.dec).qty - 1);
    if (el.dataset.remove) return setQty(el.dataset.remove, 0);
    switch (el.id) {
      case 'logo':
        state.cat = 'all'; state.q = ''; $('#search-input').value = '';
        renderGrid(); return goHome(false);
      case 'banner-cta': return goHome(true);
      case 'clear-filter':
        state.cat = 'all'; state.q = ''; $('#search-input').value = '';
        return renderGrid();
      case 'cart-btn': return showView('cart');
      case 'add-to-cart':
        addToCart(state.current, 1);
        return openModal(product(state.current));
      case 'offer-yes':
        addToCart(state.current, ADDON_QTY);
        closeModal();
        return toast(ADDON_QTY + ' more added to cart');
      case 'offer-no':
      case 'atc-close':
        return closeModal();
      case 'to-checkout':
        showView('checkout');
        return goStep(1);
      case 'checkout-back':
        return state.step > 1 ? goStep(state.step - 1) : showView('cart');
      case 'guest-continue':
        return goStep(4);
    }
  });

  $('#atc-modal').addEventListener('click', (e) => { if (e.target.id === 'atc-modal') closeModal(); });

  $('#grid').addEventListener('keydown', (e) => {
    const card = e.target.closest('.card');
    if (card && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); openProduct(card.dataset.id); }
  });

  $('#search-input').addEventListener('input', (e) => {
    state.q = e.target.value;
    renderGrid();
  });

  document.addEventListener('change', (e) => {
    if (e.target.name === 'pay') $('#card-fields').hidden = e.target.value === 'cod';
    if (e.target.name === 'plan' || e.target.id === 'addon-check') {
      if (state.step === 4) renderReview();
      renderSummary($('#checkout-summary'), state.step);
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#atc-modal').hidden) closeModal();
  });

  /* ---------- Init ---------- */
  renderGrid();
  updateCount();
  showView('home');
})();
