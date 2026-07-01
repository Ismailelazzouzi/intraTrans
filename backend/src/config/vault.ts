const VAULT_ADDR = process.env.VAULT_ADDR ?? 'http://vault:8200'
const VAULT_TOKEN = process.env.VAULT_TOKEN ?? ''

export async function loadVaultSecrets(): Promise<Record<string, string>> {
  if (!VAULT_TOKEN) {
    throw new Error('VAULT_TOKEN is not set')
  }

  const res = await fetch(`${VAULT_ADDR}/v1/secret/data/hive`, {
    headers: { 'X-Vault-Token': VAULT_TOKEN },
    signal: AbortSignal.timeout(5000),
  })

  if (!res.ok) {
    throw new Error(`Vault responded ${res.status}: ${await res.text()}`)
  }

  const body = await res.json() as { data: { data: Record<string, string> } }
  return body.data.data
}
