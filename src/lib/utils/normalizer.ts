export function normalizeExerciseName(name: string) {
    return name
        .toLowerCase() // convert to lowercase
        .normalize('NFKD') // normalize unicode (e.g., é -> e)
        .replace(/[\u0300-\u036f]/g, '') // remove diacritics
        .replace(/[^a-z0-9]+/g, ' ') // remove non-alphanumerics and collapse to space
        .trim() // remove leading/trailing whitespace
        .replace(/\s+/g, ' ') // collapse multiple spaces to one
        .split(/\s+/)
        .filter((word) => word.length > 1) // Remove single letters
        .sort() // Sort words alphabetically for order-independence
        .join(' ')
        .trim();
}
