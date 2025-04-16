/**
 * Utilidades para manejar la codificación de caracteres
 */

// Función para normalizar texto con caracteres especiales
export const normalizeText = (text) => {
  if (!text || typeof text !== "string") return text

  // Normalizar texto para manejar acentos y caracteres especiales
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

// Función para comparar textos ignorando acentos
export const compareTexts = (text1, text2) => {
  return normalizeText(text1).localeCompare(normalizeText(text2), "es", { sensitivity: "base" })
}

// Función para verificar si un texto contiene otro, ignorando acentos
export const textContains = (text, search) => {
  if (!text || !search || typeof text !== "string" || typeof search !== "string") return false

  const normalizedText = normalizeText(text).toLowerCase()
  const normalizedSearch = normalizeText(search).toLowerCase()

  return normalizedText.includes(normalizedSearch)
}

// Función para asegurar que los caracteres especiales se muestren correctamente
export const ensureCorrectEncoding = (text) => {
  if (!text || typeof text !== "string") return text

  // Asegurarse de que el texto esté correctamente codificado
  return text.normalize()
}
