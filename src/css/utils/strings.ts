
export function startsWith(haystack: string, needle: string): boolean {
  if (haystack.length < needle.length) {
    return false
  }

  for (let i = 0; i < needle.length; i++) {
    if (haystack[i] !== needle[i]) {
      return false
    }
  }

  return true
}
