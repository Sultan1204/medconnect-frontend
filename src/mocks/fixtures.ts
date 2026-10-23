/**
 * DEMO DATA ONLY. Every person, price, rating and slot here is fictional and exists so the UI
 * can be developed before the Laravel endpoints exist. Never ship this in a production build
 * (it is loaded only when VITE_API_MODE=mock and the UI shows a demo banner).
 */
import type { ConsultationOffer, DoctorProfile, Role, User } from '@/types/domain'

type L = { ar: string; en: string }

export const specialtyFixtures: Array<{ id: number; slug: string; name: L; description: L; icon: string }> = [
  { id: 1, slug: 'family-medicine', name: { ar: 'طب الأسرة', en: 'Family medicine' }, description: { ar: 'رعاية صحية شاملة لجميع أفراد الأسرة.', en: 'Comprehensive care for the whole family.' }, icon: 'home' },
  { id: 2, slug: 'pediatrics', name: { ar: 'طب الأطفال', en: 'Pediatrics' }, description: { ar: 'صحة الأطفال من الولادة حتى المراهقة.', en: 'Health of children from birth to adolescence.' }, icon: 'baby' },
  { id: 3, slug: 'dermatology', name: { ar: 'الجلدية', en: 'Dermatology' }, description: { ar: 'أمراض الجلد والشعر والأظافر.', en: 'Skin, hair and nail conditions.' }, icon: 'scan-face' },
  { id: 4, slug: 'internal-medicine', name: { ar: 'الباطنية', en: 'Internal medicine' }, description: { ar: 'تشخيص ومتابعة أمراض البالغين.', en: 'Diagnosis and follow-up of adult conditions.' }, icon: 'stethoscope' },
  { id: 5, slug: 'obgyn', name: { ar: 'النساء والولادة', en: 'Obstetrics & gynecology' }, description: { ar: 'صحة المرأة والحمل.', en: "Women's health and pregnancy." }, icon: 'heart-pulse' },
  { id: 6, slug: 'psychiatry', name: { ar: 'الطب النفسي', en: 'Psychiatry' }, description: { ar: 'الصحة النفسية والدعم.', en: 'Mental health and support.' }, icon: 'brain' },
  { id: 7, slug: 'nutrition', name: { ar: 'التغذية العلاجية', en: 'Clinical nutrition' }, description: { ar: 'خطط غذائية علاجية.', en: 'Therapeutic nutrition plans.' }, icon: 'apple' },
  { id: 8, slug: 'ent', name: { ar: 'الأنف والأذن والحنجرة', en: 'ENT' }, description: { ar: 'أمراض الأنف والأذن والحنجرة.', en: 'Ear, nose and throat conditions.' }, icon: 'ear' },
]

const offer = (type: 'chat' | 'video', sar: number, minutes: number): ConsultationOffer => ({
  type,
  price: { amount: sar * 100, currency: 'SAR' },
  duration_minutes: minutes,
})

interface DoctorFixture {
  id: number
  name: L
  title: L
  specialtyId: number
  qualifications: L[]
  languages: string[]
  offers: ConsultationOffer[]
  verified: boolean
  rating: { average: number; count: number } | null
  years: number
  bio: L
}

/** Fictional demo doctors (names are invented placeholders, not real practitioners). */
export const doctorFixtures: DoctorFixture[] = [
  { id: 101, name: { ar: 'د. تجريبي — ريم العتيبي', en: 'Dr. Demo — Reem Alotaibi' }, title: { ar: 'استشارية طب أسرة', en: 'Consultant, family medicine' }, specialtyId: 1, qualifications: [{ ar: 'بكالوريوس الطب والجراحة', en: 'MBBS' }, { ar: 'الزمالة في طب الأسرة', en: 'Fellowship in family medicine' }], languages: ['ar', 'en'], offers: [offer('chat', 0, 15), offer('video', 150, 20)], verified: true, rating: { average: 4.8, count: 126 }, years: 12, bio: { ar: 'ملف تجريبي لأغراض العرض فقط.', en: 'Demo profile for display purposes only.' } },
  { id: 102, name: { ar: 'د. تجريبي — خالد الشهري', en: 'Dr. Demo — Khalid Alshehri' }, title: { ar: 'أخصائي أطفال', en: 'Specialist, pediatrics' }, specialtyId: 2, qualifications: [{ ar: 'بكالوريوس الطب والجراحة', en: 'MBBS' }, { ar: 'البورد السعودي في طب الأطفال', en: 'Saudi Board in pediatrics' }], languages: ['ar'], offers: [offer('chat', 90, 15), offer('video', 180, 20)], verified: true, rating: { average: 4.6, count: 58 }, years: 8, bio: { ar: 'ملف تجريبي لأغراض العرض فقط.', en: 'Demo profile for display purposes only.' } },
  { id: 103, name: { ar: 'د. تجريبي — نورة القحطاني', en: 'Dr. Demo — Noura Alqahtani' }, title: { ar: 'أخصائية جلدية', en: 'Specialist, dermatology' }, specialtyId: 3, qualifications: [{ ar: 'بكالوريوس الطب والجراحة', en: 'MBBS' }, { ar: 'ماجستير الأمراض الجلدية', en: 'MSc Dermatology' }], languages: ['ar', 'en', 'fr'], offers: [offer('video', 220, 20)], verified: true, rating: null, years: 6, bio: { ar: 'ملف تجريبي لأغراض العرض فقط.', en: 'Demo profile for display purposes only.' } },
  { id: 104, name: { ar: 'د. تجريبي — عمر الغامدي', en: 'Dr. Demo — Omar Alghamdi' }, title: { ar: 'استشاري باطنية', en: 'Consultant, internal medicine' }, specialtyId: 4, qualifications: [{ ar: 'بكالوريوس الطب والجراحة', en: 'MBBS' }, { ar: 'البورد العربي في الباطنية', en: 'Arab Board in internal medicine' }], languages: ['ar', 'en'], offers: [offer('chat', 120, 15), offer('video', 250, 30)], verified: true, rating: { average: 4.9, count: 210 }, years: 15, bio: { ar: 'ملف تجريبي لأغراض العرض فقط.', en: 'Demo profile for display purposes only.' } },
  { id: 105, name: { ar: 'د. تجريبي — هيا الدوسري', en: 'Dr. Demo — Haya Aldosari' }, title: { ar: 'أخصائية نساء وولادة', en: 'Specialist, OB/GYN' }, specialtyId: 5, qualifications: [{ ar: 'بكالوريوس الطب والجراحة', en: 'MBBS' }], languages: ['ar', 'en'], offers: [offer('chat', 100, 15), offer('video', 200, 20)], verified: false, rating: null, years: 5, bio: { ar: 'ملف تجريبي لأغراض العرض فقط.', en: 'Demo profile for display purposes only.' } },
  { id: 106, name: { ar: 'د. تجريبي — فهد الحربي', en: 'Dr. Demo — Fahad Alharbi' }, title: { ar: 'استشاري طب نفسي', en: 'Consultant, psychiatry' }, specialtyId: 6, qualifications: [{ ar: 'بكالوريوس الطب والجراحة', en: 'MBBS' }, { ar: 'الزمالة في الطب النفسي', en: 'Fellowship in psychiatry' }], languages: ['ar', 'en', 'ur'], offers: [offer('video', 300, 45)], verified: true, rating: { average: 4.7, count: 74 }, years: 14, bio: { ar: 'ملف تجريبي لأغراض العرض فقط.', en: 'Demo profile for display purposes only.' } },
  { id: 107, name: { ar: 'د. تجريبي — سارة المطيري', en: 'Dr. Demo — Sara Almutairi' }, title: { ar: 'أخصائية تغذية علاجية', en: 'Clinical dietitian' }, specialtyId: 7, qualifications: [{ ar: 'ماجستير التغذية العلاجية', en: 'MSc Clinical nutrition' }], languages: ['ar'], offers: [offer('chat', 80, 20), offer('video', 140, 30)], verified: true, rating: { average: 4.5, count: 33 }, years: 7, bio: { ar: 'ملف تجريبي لأغراض العرض فقط.', en: 'Demo profile for display purposes only.' } },
  { id: 108, name: { ar: 'د. تجريبي — يوسف الزهراني', en: 'Dr. Demo — Yousef Alzahrani' }, title: { ar: 'أخصائي أنف وأذن وحنجرة', en: 'Specialist, ENT' }, specialtyId: 8, qualifications: [{ ar: 'بكالوريوس الطب والجراحة', en: 'MBBS' }], languages: ['ar', 'en'], offers: [offer('video', 190, 20)], verified: true, rating: null, years: 9, bio: { ar: 'ملف تجريبي لأغراض العرض فقط.', en: 'Demo profile for display purposes only.' } },
  { id: 109, name: { ar: 'د. تجريبي — لمى الشمري', en: 'Dr. Demo — Lama Alshammari' }, title: { ar: 'طبيبة أسرة', en: 'Family physician' }, specialtyId: 1, qualifications: [{ ar: 'بكالوريوس الطب والجراحة', en: 'MBBS' }], languages: ['ar', 'en', 'hi'], offers: [offer('chat', 60, 15), offer('video', 120, 20)], verified: true, rating: { average: 4.4, count: 41 }, years: 4, bio: { ar: 'ملف تجريبي لأغراض العرض فقط.', en: 'Demo profile for display purposes only.' } },
  { id: 110, name: { ar: 'د. تجريبي — ماجد السبيعي', en: 'Dr. Demo — Majed Alsubaie' }, title: { ar: 'استشاري أطفال', en: 'Consultant, pediatrics' }, specialtyId: 2, qualifications: [{ ar: 'بكالوريوس الطب والجراحة', en: 'MBBS' }, { ar: 'الزمالة في طب الأطفال', en: 'Fellowship in pediatrics' }], languages: ['ar', 'en'], offers: [offer('video', 260, 30)], verified: true, rating: { average: 4.9, count: 95 }, years: 18, bio: { ar: 'ملف تجريبي لأغراض العرض فقط.', en: 'Demo profile for display purposes only.' } },
  { id: 111, name: { ar: 'د. تجريبي — أمل الحمدان', en: 'Dr. Demo — Amal Alhamdan' }, title: { ar: 'أخصائية باطنية', en: 'Specialist, internal medicine' }, specialtyId: 4, qualifications: [{ ar: 'بكالوريوس الطب والجراحة', en: 'MBBS' }], languages: ['ar', 'en'], offers: [offer('chat', 0, 10)], verified: true, rating: null, years: 3, bio: { ar: 'ملف تجريبي لأغراض العرض فقط.', en: 'Demo profile for display purposes only.' } },
  { id: 112, name: { ar: 'د. تجريبي — بدر العنزي', en: 'Dr. Demo — Badr Alanazi' }, title: { ar: 'أخصائي جلدية', en: 'Specialist, dermatology' }, specialtyId: 3, qualifications: [{ ar: 'بكالوريوس الطب والجراحة', en: 'MBBS' }, { ar: 'البورد السعودي في الجلدية', en: 'Saudi Board in dermatology' }], languages: ['ar'], offers: [offer('chat', 110, 15), offer('video', 210, 20)], verified: false, rating: null, years: 6, bio: { ar: 'ملف تجريبي لأغراض العرض فقط.', en: 'Demo profile for display purposes only.' } },
]

export function localize(l: L, locale: string) {
  return locale === 'en' ? l.en : l.ar
}

export function toDoctorProfile(d: DoctorFixture, locale: string, nextAvailable: string | null): DoctorProfile {
  const s = specialtyFixtures.find((x) => x.id === d.specialtyId)!
  return {
    id: d.id,
    name: localize(d.name, locale),
    title: localize(d.title, locale),
    avatar_url: null,
    specialty: { id: s.id, slug: s.slug, name: localize(s.name, locale) },
    qualifications: d.qualifications.map((q) => localize(q, locale)),
    languages: d.languages,
    consultation_offers: d.offers,
    is_verified: d.verified,
    rating: d.rating,
    next_available_at: nextAvailable,
    bio: localize(d.bio, locale),
    experience_years: d.years,
    experience: [{ title: localize(d.title, locale), organization: locale === 'en' ? 'Demo hospital' : 'مستشفى تجريبي', from_year: 2026 - d.years, to_year: null }],
  }
}

/** Demo accounts. Password for all: Demo1234 — OTP / MFA code: 123456. */
export const userFixtures: Array<User & { id: number; password: string }> = [
  { id: 1, name: 'مريض تجريبي', email: 'patient@demo.test', phone: '+966500000001', roles: ['patient'], locale: 'ar', phone_verified_at: '2026-01-01T00:00:00Z', mfa_enabled: false, password: 'Demo1234' },
  { id: 2, name: 'د. تجريبي — ريم العتيبي', email: 'doctor@demo.test', phone: '+966500000002', roles: ['doctor'], locale: 'ar', phone_verified_at: '2026-01-01T00:00:00Z', mfa_enabled: false, doctor_status: 'approved', password: 'Demo1234' },
  { id: 3, name: 'طبيب قيد المراجعة', email: 'pending@demo.test', phone: '+966500000003', roles: ['doctor'], locale: 'ar', phone_verified_at: '2026-01-01T00:00:00Z', mfa_enabled: false, doctor_status: 'under_review', password: 'Demo1234' },
  { id: 4, name: 'صيدلي تجريبي', email: 'pharmacy@demo.test', phone: '+966500000004', roles: ['pharmacist'], locale: 'ar', phone_verified_at: '2026-01-01T00:00:00Z', mfa_enabled: false, password: 'Demo1234' },
  { id: 5, name: 'مشرف تجريبي', email: 'admin@demo.test', phone: '+966500000005', roles: ['admin'], locale: 'ar', phone_verified_at: '2026-01-01T00:00:00Z', mfa_enabled: true, password: 'Demo1234' },
]

export const DEMO_CODE = '123456'
export type { Role }
