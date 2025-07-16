import { Api } from "nocodb-sdk"

const baseURL = process.env.NEXT_PUBLIC_NOCODB_BASE_URL as string
const token = process.env.NEXT_PUBLIC_NOCODB_TOKEN as string

console.log('NoCoDB Environment Variables:', {
  baseURL,
  token: token ? 'Set' : 'Not set',
  project: process.env.NEXT_PUBLIC_NOCODB_PROJECT,
  table: process.env.NEXT_PUBLIC_NOCODB_TABLE
})

if (!baseURL || !token) {
  console.error("NocoDB env vars not set:", { baseURL, token })
  throw new Error("NocoDB env vars not set: NEXT_PUBLIC_NOCODB_BASE_URL & NEXT_PUBLIC_NOCODB_TOKEN")
}

export const nocodb = new Api({
  baseURL,
  headers: {
    "xc-token": token,
  },
})

// Test connection function
export const testNocoDBConnection = async () => {
  try {
    const projectSlug = process.env.NEXT_PUBLIC_NOCODB_PROJECT as string
    const tableSlug = process.env.NEXT_PUBLIC_NOCODB_TABLE as string
    
    console.log('Testing NoCoDB connection with:', { projectSlug, tableSlug })
    
    const response = await nocodb.dbTableRow.list(projectSlug, tableSlug, {
      limit: 1,
      offset: 0
    })
    
    console.log('NoCoDB connection test successful:', response)
    return response
  } catch (error) {
    console.error('NoCoDB connection test failed:', error)
    throw error
  }
}