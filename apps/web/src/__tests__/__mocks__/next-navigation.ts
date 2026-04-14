// Mock for next/navigation
export const redirect = (url: string) => { throw new Error(`redirect: ${url}`) }
export const notFound = () => { throw new Error('notFound') }
