export function calculateKategori(tarikhLahir: string, tarikhKejohanan: string): string {
  const lahir = new Date(tarikhLahir).getFullYear()
  const kejohanan = new Date(tarikhKejohanan).getFullYear()
  const umur = kejohanan - lahir

  if (umur <= 12) return 'B12'
  if (umur <= 14) return 'B14'
  if (umur <= 16) return 'B16'
  if (umur <= 18) return 'B18'
  return 'TERBUKA'
}
