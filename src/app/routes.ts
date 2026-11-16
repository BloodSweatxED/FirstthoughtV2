export type Route =
  | { page: 'home' }
  | { page: 'student'; code: string }
  | { page: 'host'; code: string }
  | { page: 'poster'; code: string }
  | { page: 'recap'; code: string }

export const parseRoute = (pathname: string): Route => {
  const match = pathname.match(/^\/r\/([A-Za-z]{4})(?:\/(host|poster|recap))?\/?$/)
  if (!match) return { page: 'home' }
  const code = match[1].toUpperCase()
  if (match[2] === 'host') return { page: 'host', code }
  if (match[2] === 'poster') return { page: 'poster', code }
  if (match[2] === 'recap') return { page: 'recap', code }
  return { page: 'student', code }
}

export const studentPath = (code: string) => `/r/${code}`
export const hostPath = (code: string) => `/r/${code}/host`
export const posterPath = (code: string) => `/r/${code}/poster`
export const recapPath = (code: string) => `/r/${code}/recap`
export const absoluteUrl = (path: string) => `${window.location.origin}${path}`
