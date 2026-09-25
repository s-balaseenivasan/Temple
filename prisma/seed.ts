/**
 * Seed script — real temple content per blueprint/_CONTEXT_BRIEF.md §11 (CR-004)
 * and blueprint/DATA_MODEL.md seed-value notes. Safe to re-run (idempotent upserts).
 */
import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const SITE_SETTINGS_ID = "00000000-0000-0000-0000-000000000001";

async function main() {
  // ── SiteSettings singleton ────────────────────────────────────────────
  await prisma.siteSettings.upsert({
    where: { id: SITE_SETTINGS_ID },
    update: {},
    create: {
      id: SITE_SETTINGS_ID,
      templeName_en: "Sri Gurusamy Sri Ananthammal Temple",
      templeName_ta: "ஸ்ரீ குருசாமி – ஸ்ரீ அனந்தம்மாள் கோவில்",
      addressLine_en: "3, Kottai Street, Thirumangalam - 625706, Madurai District, Tamil Nadu",
      addressLine_ta: "3, கோட்டைத்தெரு, திருமங்கலம் – 625706, மதுரை மாவட்டம், தமிழ்நாடு",
      // Real phone/WhatsApp/email are UNKNOWN per the source content ("[Update]") — left blank deliberately, not fabricated.
      phone: "",
      email: null,
      timingsJson: {
        morning: { open: "05:30", close: "12:00" },
        evening: { open: "16:30", close: "21:00" },
        specialDayOverrides: [],
      },
      socialLinksJson: {},
      is80GRegistered: false,
      activeLanguages: ["en", "ta"],
      historyIntro_en:
        "Sri Gurusamy - Sri Ananthammal Temple, located on Kottai Street, Thirumangalam, was established by our ancestors many generations ago and has been worshipped and maintained as our kuladeivam by generations of Pangaligal ever since.",
      historyIntro_ta:
        "திருமங்கலம் கோட்டை தெருவில் அமைந்துள்ள ஸ்ரீ குருசாமி – ஸ்ரீ அனந்தம்மாள் கோவில், நமது முன்னோர்களால் பல நூற்றாண்டுகளுக்கு முன்னர் ஸ்தாபிக்கப்பட்டு, தலைமுறை தலைமுறையாக நமது பங்காளிகளால் குலதெய்வமாக வழிபட்டு பராமரிக்கப்பட்டு வரும் பாரம்பரிய வழிபாட்டுத் தலமாகும்.",
      adminStructureNote_en:
        "The managing committee has 15 seats: 1 President, 1 Secretary, 1 Treasurer, and 12 Committee Members representing the five ancestral lineage branches (kottu vazhi). The committee's term is three years.",
      adminStructureNote_ta:
        "மொத்தம் 15 செயற்குழு உறுப்பினர்கள் நிர்வாகத்தில் இடம்பெறுகின்றனர் (தலைவர், செயலாளர், பொருளாளர், மற்றும் 12 செயற்குழு உறுப்பினர்கள் - ஐந்து கொத்து வழி பங்காளிகளின் பிரதிநிதித்துவத்தின் அடிப்படையில்). செயற்குழுவின் பதவிக்காலம் மூன்று ஆண்டுகள்.",
      bhakthaSabhaIntro_en:
        "Bhaktha Sabha exists to foster devotion and spread spiritual knowledge among our Pangaligal. Eligible men, women, and children may participate in Bhaktha Sabha activities per committee rules.",
      bhakthaSabhaIntro_ta:
        "தெய்வ பக்தியை வளர்த்தல் மற்றும் ஆன்மீக அறிவைப் பரப்புதல் ஆகியவற்றை முக்கிய நோக்கமாகக் கொண்டு பக்த சபை செயல்படுகிறது. நிர்வாக விதிமுறைகளின்படி தகுதியுடைய ஆண்கள், பெண்கள் மற்றும் குழந்தைகள் பக்த சபை நிகழ்வுகளில் பங்கேற்கலாம்.",
      transparencyNote_en:
        "Our financial year runs from April 1 to March 31. Accounts are audited annually and presented to the Annual General Body for approval. Meeting proceedings and resolutions are formally recorded and maintained.",
      transparencyNote_ta:
        "நமது நிர்வாகத்தின் வரவு–செலவு கணக்குகள் முறையாக பராமரிக்கப்படுகின்றன. கணக்கு ஆண்டு: ஏப்ரல் 1 முதல் மார்ச் 31 வரை. நிர்வாக விதிமுறைகளின்படி ஆண்டுதோறும் கணக்குகள் தணிக்கை செய்யப்பட்டு, வருடாந்திர பொதுக்குழுவின் அங்கீகாரத்திற்கு சமர்ப்பிக்கப்படுகின்றன.",
    },
  });

  // ── First Super Admin (bootstrap) ─────────────────────────────────────
  // Security review: never create admin accounts with the publicly known
  // default password in production — require an explicit one.
  if (process.env.NODE_ENV === "production" && !process.env.BOOTSTRAP_ADMIN_PASSWORD) {
    throw new Error("Set BOOTSTRAP_ADMIN_PASSWORD before seeding a production database.");
  }
  const bootstrapPassword = process.env.BOOTSTRAP_ADMIN_PASSWORD ?? "ChangeMe!12345";
  const passwordHash = await bcrypt.hash(bootstrapPassword, 12);
  const superAdmin = await prisma.adminUser.upsert({
    where: { email: "admin@temple.local" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@temple.local",
      passwordHash,
      role: "SuperAdmin",
      status: "active",
    },
  });

  // Second seeded account so PERM-000..025 role restrictions are actually
  // testable (Super-Admin-only actions, etc.) rather than only assumed from
  // the code — see IMPLEMENTATION_PROGRESS.md, this was a real verification gap.
  const templeAdminPasswordHash = await bcrypt.hash(bootstrapPassword, 12);
  const templeAdmin = await prisma.adminUser.upsert({
    where: { email: "office@temple.local" },
    update: {},
    create: {
      name: "Temple Office Admin",
      email: "office@temple.local",
      passwordHash: templeAdminPasswordHash,
      role: "TempleAdmin",
      status: "active",
    },
  });

  // ── Designation lookup (RULE-025: configurable, not hardcoded) ────────
  const designations = [
    { name_en: "President", name_ta: "தலைவர்", sortOrder: 1 },
    { name_en: "Secretary", name_ta: "செயலாளர்", sortOrder: 2 },
    { name_en: "Treasurer", name_ta: "பொருளாளர்", sortOrder: 3 },
    { name_en: "Committee Member", name_ta: "செயற்குழு உறுப்பினர்", sortOrder: 4 },
  ];
  for (const d of designations) {
    await prisma.designation.upsert({ where: { name_en: d.name_en }, update: {}, create: d });
  }

  // ── EventCategory lookup ───────────────────────────────────────────────
  const eventCategories = [
    { name_en: "Festival", name_ta: "திருவிழா" },
    { name_en: "Pooja", name_ta: "பூஜை" },
    { name_en: "Community", name_ta: "சமூக நிகழ்ச்சி" },
    { name_en: "Annadhanam", name_ta: "அன்னதானம்" },
  ];
  for (const c of eventCategories) {
    await prisma.eventCategory.upsert({ where: { name_en: c.name_en }, update: {}, create: c });
  }

  // ── DonationPurpose — real seed values, §11.4 CONFIRMED ───────────────
  const donationPurposes = [
    { name_en: "Temple Maintenance", name_ta: "கோவில் பராமரிப்பு", sortOrder: 1 },
    { name_en: "Pooja & Festival", name_ta: "பூஜை மற்றும் திருவிழா", sortOrder: 2 },
    { name_en: "Annadhanam", name_ta: "அன்னதானம்", sortOrder: 3 },
    { name_en: "Education & Welfare Aid", name_ta: "கல்வி மற்றும் நல உதவிகள்", sortOrder: 4 },
    { name_en: "Approved Development Works", name_ta: "அங்கீகரிக்கப்பட்ட வளர்ச்சிப் பணிகள்", sortOrder: 5 },
  ];
  for (const p of donationPurposes) {
    await prisma.donationPurpose.upsert({ where: { name_en: p.name_en }, update: {}, create: p });
  }

  // ── Deity — real seed values, §11.1 CONFIRMED ─────────────────────────
  const deities = [
    {
      name_en: "Sri Vinayagar",
      name_ta: "ஸ்ரீ விநாயகர்",
      description_en: "Worshipped as the foremost deity for all auspicious undertakings.",
      description_ta: "அனைத்து நல்ல காரியங்களுக்கும் முதற்கடவுளாக வணங்கப்படுகிறார்.",
      sortOrder: 1,
    },
    {
      name_en: "Sri Gurusamy",
      name_ta: "ஸ்ரீ குருசாமி",
      description_en: "The presiding deity of the main sanctum, worshipped with the traditional lamp-lighting rite.",
      description_ta: "மூலஸ்தானத்தில் தீப வழிபாட்டு மரபுடன் வழிபடப்படும் முக்கிய தெய்வம்.",
      sortOrder: 2,
    },
    {
      name_en: "Sri Ananthammal",
      name_ta: "ஸ்ரீ அனந்தம்மாள்",
      description_en: "Holds a central place in the kuladeivam worship of our Pangaligal.",
      description_ta: "நமது பங்காளிகளின் குலதெய்வ வழிபாட்டில் முக்கிய இடம் பெற்ற தெய்வம்.",
      sortOrder: 3,
    },
    {
      name_en: "Sri Karuppanasamy",
      name_ta: "ஸ்ரீ கருப்பணசாமி",
      description_en: "Worshipped in the traditional manner as the guardian deity.",
      description_ta: "காவல் தெய்வமாக பாரம்பரிய முறைப்படி வழிபடப்படுகிறார்.",
      sortOrder: 4,
    },
    {
      name_en: "Sri Nagammal",
      name_ta: "ஸ்ரீ நாகம்மாள்",
      description_en: "Worshipped as part of our temple's traditional deity worship.",
      description_ta: "நமது ஆலயத்தின் பாரம்பரிய தெய்வ வழிபாட்டின் ஓர் அங்கமாக வழிபடப்படுகிறார்.",
      sortOrder: 5,
    },
  ];
  for (const d of deities) {
    const existing = await prisma.deity.findFirst({ where: { name_en: d.name_en } });
    if (!existing) await prisma.deity.create({ data: d });
  }

  // ── FestivalTradition — real seed values, §11.3 CONFIRMED ─────────────
  const festivals = [
    {
      name_en: "Peria Pooja",
      name_ta: "பெரிய பூஜை",
      description_en:
        "A four-day traditional festival held every year in the Tamil month of Margazhi, including poojas, communal feasts (panthi), prasadam distribution, and traditional events. On the fourth day, a procession carries offerings to Sri Bathrakaliamman at Venkatesamuthiram.",
      description_ta:
        "ஒவ்வொரு ஆண்டும் தமிழ் மார்கழி மாதத்தில் பாரம்பரிய முறைப்படி நான்கு நாட்கள் பெரிய பூஜை நடைபெறுகிறது.",
      sortOrder: 1,
    },
    {
      name_en: "Chithra Pournami",
      name_ta: "சித்ரா பௌர்ணமி",
      description_en: "A special pooja is conducted every year on Chithra Pournami, with prasadam distributed.",
      description_ta: "ஒவ்வொரு ஆண்டும் சித்ரா பௌர்ணமி அன்று சிறப்பு பூஜை நடத்தப்பட்டு பிரசாதம் வழங்கப்படுகிறது.",
      sortOrder: 2,
    },
    {
      name_en: "Purattasi Saturday Poojas",
      name_ta: "புரட்டாசி சனிக்கிழமை பூஜைகள்",
      description_en: "Special evening poojas are held on every Saturday of the Purattasi month, with prasadam distributed.",
      description_ta: "புரட்டாசி மாதத்தின் அனைத்து சனிக்கிழமைகளிலும் மாலை நேரத்தில் சிறப்பு பூஜைகள் நடத்தப்பட்டு பிரசாதம் வழங்கப்படுகிறது.",
      sortOrder: 3,
    },
    {
      name_en: "Mahalaya Amavasai",
      name_ta: "மகாளய அமாவாசை",
      description_en: "Ancestors are remembered on Purattasi Mahalaya Amavasai with a Moksha Deepam lamp-lighting rite and Annadhanam.",
      description_ta: "புரட்டாசி மகாளய அமாவாசை அன்று முன்னோர்களை நினைவுகூர்ந்து மோட்ச தீபம் ஏற்றி வழிபாடு செய்து அன்னதானம் வழங்கப்படுகிறது.",
      sortOrder: 4,
    },
    {
      name_en: "Vaikasi Thiruvizha",
      name_ta: "வைகாசி திருவிழா",
      description_en:
        "Our Pangaligal traditionally participate in the annual 13-day Vaikasi festival of the neighboring Sri Bathrakali Mariamman Temple, to which the Thirumangalam Pandiyakula Kshatriya Nadars community is connected by kinship.",
      description_ta:
        "திருமங்கலம் பாண்டியகுல க்ஷத்ரிய நாடார்கள் உறவின்முறைக்கு பாத்தியப்பட்ட அருள்மிகு ஸ்ரீ பத்ரகாளி மாரியம்மன் திருக்கோவிலின் வருடாந்திர வைகாசி 13 நாள் திருவிழாவில், நமது பங்காளிகள் பாரம்பரிய முறைப்படி பல்வேறு நிகழ்வுகளில் பங்கேற்று சிறப்பு செய்கின்றனர்.",
      sortOrder: 5,
    },
  ];
  for (const f of festivals) {
    const existing = await prisma.festivalTradition.findFirst({ where: { name_en: f.name_en } });
    if (!existing) await prisma.festivalTradition.create({ data: f });
  }

  // ── WelfareProgram — real seed values, §11.3 CONFIRMED, informational only ──
  const welfarePrograms = [
    {
      name_en: "Education Aid",
      name_ta: "கல்வி உதவி",
      description_en: "Support for children's education and textbook needs.",
      description_ta: "குழந்தைகளின் கல்வி மற்றும் பாடப்புத்தக தேவைகளுக்கு உதவுதல்.",
      sortOrder: 1,
    },
    {
      name_en: "Marriage Aid",
      name_ta: "திருமண உதவி",
      description_en: "Support toward the marriage needs of eligible families.",
      description_ta: "தகுதியுடைய குடும்பங்களின் திருமண தேவைகளுக்கு உதவுதல்.",
      sortOrder: 2,
    },
    {
      name_en: "Elderly Welfare",
      name_ta: "முதியோர் நலன்",
      description_en: "Support toward the wellbeing needs of the elderly.",
      description_ta: "முதியோர்களின் நல்வாழ்விற்கு தேவையான உதவிகளை ஊக்குவித்தல்.",
      sortOrder: 3,
    },
    {
      name_en: "Medical Aid",
      name_ta: "மருத்துவ உதவி",
      description_en: "Support toward necessary medical facilities and treatment.",
      description_ta: "தேவையான மருத்துவ வசதிகள் மற்றும் மருத்துவ உதவிகளை ஊக்குவித்தல்.",
      sortOrder: 4,
    },
    {
      name_en: "Funeral Aid",
      name_ta: "இறுதிச் சடங்கு உதவி",
      description_en: "Support for families in necessary circumstances relating to funeral rites.",
      description_ta: "தேவையான சூழ்நிலைகளில் குடும்பங்களுக்கு உதவுதல்.",
      sortOrder: 5,
    },
  ];
  for (const w of welfarePrograms) {
    const existing = await prisma.welfareProgram.findFirst({ where: { name_en: w.name_en } });
    if (!existing) await prisma.welfareProgram.create({ data: w });
  }

  // ── Demo/test-fixture data below ───────────────────────────────────────
  // Everything above this line is real content sourced from the blueprint
  // (§11, CONFIRMED). Nothing below is real — no committee roster, specific
  // news items, dated event instances, donor records, or enquiries exist in
  // the source content, so this is realistic-looking but fabricated dev/demo
  // data, purely to exercise the admin CRUD screens and public listing pages
  // with non-empty, plausible content. Deliberately NOT seeded here for the
  // same reason the phone number above was left blank rather than invented:
  // HistoryTimelineEntry (specific founding-era dates/events) and Video
  // (a real YouTube URL) would be fabricated facts *about a real temple*,
  // not just filler test rows — an admin could mistake either for real
  // content and publish it. Committee names/news/events/donations below are
  // generic enough that this risk doesn't apply the same way.

  // Three real photos of the temple, already uploaded during this session.
  const TEMPLE_PHOTO_HERO = "https://res.cloudinary.com/parking-management-system/image/upload/v1790334712/temple/site-settings/grjnbsvicjxigwzwy1lk.jpg";
  const TEMPLE_PHOTO_2 = "https://res.cloudinary.com/parking-management-system/image/upload/v1790334984/temple/gallery/tudybjurx91puplh8jqu.jpg";
  const TEMPLE_PHOTO_3 = "https://res.cloudinary.com/parking-management-system/image/upload/v1790334989/temple/gallery/vg3canrimffp9euz8wqu.jpg";

  // ── CommitteeMember — 15 seats per SiteSettings.adminStructureNote ────
  const designationByName = Object.fromEntries(
    (await prisma.designation.findMany()).map((d) => [d.name_en, d]),
  );
  const committeeMembers = [
    { name_en: "Muthuvel Pandian Nadar", name_ta: "முத்துவேல் பாண்டியன் நாடார்", designation: "President", mobile: "9840010001", publicMobileVisible: true },
    { name_en: "Rajendran Nadar", name_ta: "ராஜேந்திரன் நாடார்", designation: "Secretary", mobile: "9840010002", publicMobileVisible: true },
    { name_en: "Karuppasamy Nadar", name_ta: "கருப்பசாமி நாடார்", designation: "Treasurer", mobile: "9840010003", publicMobileVisible: true },
    { name_en: "Sivakumar Nadar", name_ta: "சிவகுமார் நாடார்", designation: "Committee Member", mobile: "9840010004" },
    { name_en: "Manikandan Nadar", name_ta: "மணிகண்டன் நாடார்", designation: "Committee Member", mobile: "9840010005" },
    { name_en: "Palanisamy Nadar", name_ta: "பழனிசாமி நாடார்", designation: "Committee Member", mobile: "9840010006" },
    { name_en: "Selvaraj Nadar", name_ta: "செல்வராஜ் நாடார்", designation: "Committee Member", mobile: "9840010007" },
    { name_en: "Murugesan Nadar", name_ta: "முருகேசன் நாடார்", designation: "Committee Member", mobile: "9840010008" },
    { name_en: "Chinnathurai Nadar", name_ta: "சின்னத்துரை நாடார்", designation: "Committee Member", mobile: "9840010009" },
    { name_en: "Kumaresan Nadar", name_ta: "குமரேசன் நாடார்", designation: "Committee Member", mobile: "9840010010" },
    { name_en: "Ponraj Nadar", name_ta: "பொன்ராஜ் நாடார்", designation: "Committee Member", mobile: "9840010011" },
    { name_en: "Balasubramaniam Nadar", name_ta: "பாலசுப்ரமணியம் நாடார்", designation: "Committee Member", mobile: "9840010012" },
    { name_en: "Subramani Nadar", name_ta: "சுப்ரமணி நாடார்", designation: "Committee Member", mobile: "9840010013" },
    { name_en: "Arumugam Nadar", name_ta: "அருமுகம் நாடார்", designation: "Committee Member", mobile: "9840010014" },
    { name_en: "Vellaiyan Nadar", name_ta: "வெள்ளையன் நாடார்", designation: "Committee Member", mobile: "9840010015" },
  ];
  for (const [i, m] of committeeMembers.entries()) {
    const existing = await prisma.committeeMember.findFirst({ where: { name_en: m.name_en } });
    if (!existing) {
      await prisma.committeeMember.create({
        data: {
          name_en: m.name_en,
          name_ta: m.name_ta,
          designationId: designationByName[m.designation].id,
          mobile: m.mobile,
          publicMobileVisible: m.publicMobileVisible ?? false,
          bio_en: "Serves the temple committee on behalf of the Pangaligal of Thirumangalam.",
          displayOrder: i,
          status: "active",
        },
      });
    }
  }

  // ── News ────────────────────────────────────────────────────────────
  const newsItems = [
    {
      title_en: "Peria Pooja 2026 Dates Announced",
      title_ta: "பெரிய பூஜை 2026 தேதிகள் அறிவிப்பு",
      body_en:
        "The committee is pleased to announce that this year's Peria Pooja will be held over four days in the Tamil month of Margazhi, concluding with the traditional procession to Sri Bathrakaliamman Temple, Venkatesamuthiram. All Pangaligal are requested to participate and extend their support.",
      body_ta: "இவ்வாண்டு பெரிய பூஜை மார்கழி மாதத்தில் நான்கு நாட்கள் நடைபெறும். அனைத்து பங்காளிகளும் கலந்துகொண்டு சிறப்பிக்குமாறு அன்புடன் கேட்டுக்கொள்ளப்படுகிறார்கள்.",
      category: "Festival",
      status: "published" as const,
    },
    {
      title_en: "Temple Renovation Update: Sanctum Roof Repainted",
      title_ta: "கோவில் புனரமைப்பு: மூலஸ்தான கூரை வண்ணம் பூசப்பட்டது",
      body_en:
        "As part of ongoing maintenance work funded entirely through Pangaligal and devotee contributions, the sanctum roof has been repainted in traditional colors. The committee thanks everyone who contributed toward temple upkeep this year.",
      body_ta: "பங்காளிகள் மற்றும் பக்தர்களின் நன்கொடையின் மூலம் மூலஸ்தான கூரை பாரம்பரிய வண்ணங்களில் புதுப்பிக்கப்பட்டுள்ளது.",
      category: "Renovation",
      status: "published" as const,
    },
    {
      title_en: "Annadhanam Continues Every Saturday During Purattasi",
      title_ta: "புரட்டாசி மாத சனிக்கிழமைகளில் அன்னதானம் தொடர்கிறது",
      body_en:
        "Special evening poojas followed by Annadhanam will be held on every Saturday of Purattasi month this year, as per tradition. Devotees are welcome to attend and participate in the prasadam distribution.",
      body_ta: "இவ்வாண்டும் புரட்டாசி மாத சனிக்கிழமைகளில் சிறப்பு பூஜை மற்றும் அன்னதானம் நடைபெறும்.",
      category: "Announcement",
      status: "published" as const,
    },
    {
      title_en: "New Managing Committee Elected for 2026-2029 Term",
      title_ta: "2026-2029 பதவிக்காலத்திற்கான புதிய நிர்வாகக் குழு தேர்ந்தெடுக்கப்பட்டது",
      body_en:
        "The General Body meeting held this year concluded with the election of the new 15-member managing committee for the upcoming three-year term. The full list is available on the Committee page.",
      body_ta: "இவ்வாண்டு நடைபெற்ற பொதுக்குழு கூட்டத்தில் அடுத்த மூன்று ஆண்டுகளுக்கான 15 பேர் கொண்ட நிர்வாகக் குழு தேர்ந்தெடுக்கப்பட்டது.",
      category: "Announcement",
      status: "published" as const,
    },
    {
      title_en: "Notice: Annual General Body Meeting Scheduled",
      title_ta: "அறிவிப்பு: வருடாந்திர பொதுக்குழு கூட்டம்",
      body_en:
        "The Annual General Body meeting to present audited accounts and committee activities for approval will be held shortly. Date, time and venue will be shared with all Pangaligal in advance.",
      body_ta: "தணிக்கை செய்யப்பட்ட கணக்குகள் மற்றும் நடவடிக்கைகள் அங்கீகாரத்திற்காக வருடாந்திர பொதுக்குழு கூட்டம் விரைவில் நடைபெறும்.",
      category: "Notice",
      status: "draft" as const,
    },
  ];
  for (const n of newsItems) {
    const existing = await prisma.news.findFirst({ where: { title_en: n.title_en } });
    if (!existing) {
      await prisma.news.create({
        data: { ...n, authorId: templeAdmin.id, publishedAt: n.status === "published" ? new Date() : null },
      });
    }
  }

  // ── Events — dated instances of the evergreen FestivalTraditions ──────
  const eventCategoryByName = Object.fromEntries(
    (await prisma.eventCategory.findMany()).map((c) => [c.name_en, c]),
  );
  const events = [
    {
      name_en: "Peria Pooja 2026",
      name_ta: "பெரிய பூஜை 2026",
      description_en: "Four-day annual festival including poojas, communal feasts, and the closing procession to Sri Bathrakaliamman Temple, Venkatesamuthiram.",
      eventDate: new Date("2026-12-14"),
      category: "Festival",
      status: "published" as const,
    },
    {
      name_en: "Chithra Pournami Special Pooja",
      name_ta: "சித்ரா பௌர்ணமி சிறப்பு பூஜை",
      description_en: "Special pooja with prasadam distribution, as per tradition.",
      eventDate: new Date("2026-04-02"),
      category: "Pooja",
      status: "published" as const,
    },
    {
      name_en: "Purattasi Saturday Special Pooja",
      name_ta: "புரட்டாசி சனிக்கிழமை சிறப்பு பூஜை",
      description_en: "Special evening pooja held on Saturdays through the Purattasi month, with prasadam distributed.",
      eventDate: new Date("2026-09-19"),
      category: "Pooja",
      status: "published" as const,
    },
    {
      name_en: "Mahalaya Amavasai Annadhanam",
      name_ta: "மகாளய அமாவாசை அன்னதானம்",
      description_en: "Moksha Deepam lamp-lighting rite for ancestors, followed by Annadhanam.",
      eventDate: new Date("2026-10-10"),
      category: "Annadhanam",
      status: "published" as const,
    },
    {
      name_en: "Vaikasi Thiruvizha Participation",
      name_ta: "வைகாசி திருவிழா பங்கேற்பு",
      description_en: "Pangaligal participation in the neighboring Sri Bathrakali Mariamman Temple's annual 13-day Vaikasi festival.",
      eventDate: new Date("2026-05-22"),
      category: "Festival",
      status: "published" as const,
    },
    {
      name_en: "Pangaligal Community Meet",
      name_ta: "பங்காளிகள் சந்திப்பு நிகழ்ச்சி",
      description_en: "Informal gathering for Pangaligal to meet the new committee and discuss upcoming activities.",
      eventDate: new Date("2026-11-08"),
      category: "Community",
      status: "draft" as const,
    },
  ];
  for (const e of events) {
    const existing = await prisma.event.findFirst({ where: { name_en: e.name_en } });
    if (!existing) {
      const { category, ...rest } = e;
      await prisma.event.create({ data: { ...rest, categoryId: eventCategoryByName[category].id } });
    }
  }

  // ── GalleryAlbum / GalleryPhoto — real temple photos ───────────────────
  let templeAlbum = await prisma.galleryAlbum.findFirst({ where: { title_en: "Temple Premises" } });
  if (!templeAlbum) {
    templeAlbum = await prisma.galleryAlbum.create({
      data: {
        title_en: "Temple Premises",
        title_ta: "கோவில் வளாகம்",
        category: "Temple",
        coverImage: TEMPLE_PHOTO_HERO,
        description_en: "Views of the temple building and premises, Thirumangalam.",
      },
    });
    await prisma.galleryPhoto.createMany({
      data: [
        { albumId: templeAlbum.id, imageUrl: TEMPLE_PHOTO_HERO, caption_en: "Temple frontage", sortOrder: 0 },
        { albumId: templeAlbum.id, imageUrl: TEMPLE_PHOTO_2, caption_en: "Gopuram and entrance", sortOrder: 1 },
        { albumId: templeAlbum.id, imageUrl: TEMPLE_PHOTO_3, caption_en: "Temple premises", sortOrder: 2 },
      ],
    });
  }

  // ── Donation — offline/cash entries recorded by admin (test fixtures) ──
  const purposeByName = Object.fromEntries(
    (await prisma.donationPurpose.findMany()).map((p) => [p.name_en, p]),
  );
  const donations = [
    { donorName: "Ramasamy Pillai", mobile: "9944010021", amount: 5001, purpose: "Temple Maintenance" },
    { donorName: "Lakshmi Devi", mobile: "9944010022", amount: 1001, purpose: "Pooja & Festival" },
    { donorName: "Anbarasan K", mobile: "9944010023", amount: 501, purpose: "Annadhanam" },
    { donorName: "Meenakshi Sundaram", mobile: "9944010024", amount: 2500, purpose: "Education & Welfare Aid" },
    { donorName: "Devanathan R", mobile: "9944010025", amount: 251, purpose: "Temple Maintenance", anonymous: true },
    { donorName: "Saraswathi Ammal", mobile: "9944010026", amount: 1500, purpose: "Approved Development Works" },
    { donorName: "Perumal Raja", mobile: "9944010027", amount: 11000, purpose: "Pooja & Festival" },
    { donorName: "Kanmani S", mobile: "9944010028", amount: 750, purpose: "Annadhanam" },
  ];
  for (const d of donations) {
    const existing = await prisma.donation.findFirst({ where: { mobile: d.mobile, amount: d.amount } });
    if (!existing) {
      await prisma.donation.create({
        data: {
          donorName: d.donorName,
          mobile: d.mobile,
          amount: d.amount,
          purposeId: purposeByName[d.purpose].id,
          anonymous: d.anonymous ?? false,
          status: "success",
          donationType: "cash_offline",
          recordedByAdminId: templeAdmin.id,
        },
      });
    }
  }

  // ── ContactEnquiry ──────────────────────────────────────────────────
  const enquiries = [
    {
      name: "Senthil Kumar",
      mobile: "9789010031",
      enquirerType: "pangali" as const,
      message: "I would like to know the process for updating my family details in the Pangali records.",
      status: "new" as const,
    },
    {
      name: "Priya Raghavan",
      mobile: "9789010032",
      email: "priya.r@example.com",
      enquirerType: "bhaktar" as const,
      message: "Could you share the temple's daily pooja timings and how to reach it from Madurai bus stand?",
      status: "responded" as const,
    },
    {
      name: "Gopalakrishnan V",
      mobile: "9789010033",
      enquirerType: "pangali" as const,
      message: "Requesting guidance on the matrimony details update process mentioned on the Pangaligal page.",
      status: "closed" as const,
    },
  ];
  for (const en of enquiries) {
    const existing = await prisma.contactEnquiry.findFirst({ where: { mobile: en.mobile } });
    if (!existing) {
      await prisma.contactEnquiry.create({
        data: { ...en, handledByAdminId: en.status !== "new" ? templeAdmin.id : null },
      });
    }
  }

  // ── MemberRequest ───────────────────────────────────────────────────
  const memberRequests = [
    {
      requestType: "registration" as const,
      pangaliName: "Kathiresan Nadar",
      familyRepresentativeName: "Kathiresan Nadar",
      mobile: "9789010041",
      details: "New family requesting registration as Pangaligal; recently relocated to Thirumangalam.",
      status: "new" as const,
    },
    {
      requestType: "family_update" as const,
      pangaliName: "Amutha Devi",
      familyRepresentativeName: "Amutha Devi",
      mobile: "9789010042",
      details: "Requesting addition of newborn child's name to family records.",
      status: "in_review" as const,
    },
    {
      requestType: "contact_update" as const,
      pangaliName: "Velmurugan S",
      familyRepresentativeName: "Velmurugan S",
      mobile: "9789010043",
      details: "Mobile number and address have changed; requesting records be updated.",
      status: "completed" as const,
    },
  ];
  for (const mr of memberRequests) {
    const existing = await prisma.memberRequest.findFirst({ where: { mobile: mr.mobile } });
    if (!existing) {
      await prisma.memberRequest.create({
        data: { ...mr, handledByAdminId: mr.status !== "new" ? templeAdmin.id : null },
      });
    }
  }

  console.log("Seed complete.");
  console.log(`Bootstrap Super Admin: admin@temple.local / ${bootstrapPassword} (CHANGE THIS after first login)`);
  console.log(`Bootstrap Temple Admin: office@temple.local / ${bootstrapPassword} (CHANGE THIS after first login)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
