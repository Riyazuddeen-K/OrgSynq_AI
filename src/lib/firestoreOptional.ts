import { deleteField, type FieldValue } from 'firebase/firestore'

/**
 * Firestore's addDoc() rejects an explicit `undefined` field value
 * outright (unlike `null`). Use this when building a *create* payload:
 * spread the result in to include the field only when it actually has a
 * value, omitting the key entirely otherwise — e.g.
 *   { title, ...optionalField('category', category) }
 */
export function optionalField<K extends string>(key: K, value: string | undefined | null): Partial<Record<K, string>> {
  const trimmed = value?.trim()
  return trimmed ? ({ [key]: trimmed } as Record<K, string>) : {}
}

/**
 * For *update* payloads: an empty value should actually remove the field
 * from the document (e.g. someone clears a category back to blank),
 * not just be silently skipped — which is what omitting the key would
 * do, since updateDoc() only touches keys present in the payload. This
 * returns Firestore's deleteField() sentinel for empty/blank values, or
 * the trimmed value otherwise, so the key can always be included as-is.
 */
export function valueOrDeleteField(value: string | undefined | null): string | FieldValue {
  const trimmed = value?.trim()
  return trimmed ? trimmed : deleteField()
}
