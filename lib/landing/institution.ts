export const INSTITUTION = {
  name: "Institución Educativa para el trabajo y el desarrollo humano Stanford English Academy",
  shortName: "Stanford English Academy",
  address: "Avenida 10 No. 21–26. Once de Noviembre",
  municipality: "Los Patios",
  neighborhood: "Once de Noviembre",
  phone: "6075556190",
  mobile: "321-4109002",
  email: "Academiaenglishstanford@gmail.com",
  chamberRegistration: "00145760 del 08 de noviembre del 2005",
  nit: "60441653-1",
  enrollmentRenewal: "18 de marzo de 2024",
  director: "Maribel Chacón Melgarejo",
  mapEmbedUrl:
    "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d494.07494671501166!2d-72.51047710039636!3d7.832134340596978!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e66461a417d3e39%3A0xa721243296778c99!2sCorporacion%20Educativa%20Compuhelp!5e0!3m2!1ses!2sco!4v1781214100189!5m2!1ses!2sco",
} as const;

export function institutionTelHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("57")) return `tel:+${digits}`;
  if (digits.length === 10) return `tel:+57${digits}`;
  return `tel:+${digits}`;
}

export function institutionMailtoHref(email: string): string {
  return `mailto:${email}`;
}
