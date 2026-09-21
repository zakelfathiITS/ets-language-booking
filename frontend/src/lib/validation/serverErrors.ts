/** Errors returned by the API, ready to be displayed by a form. */
export interface ServerFormErrors {
  /** Message for the whole form (shown when no field is to blame). */
  message: string | null;
  /** Messages attached to specific fields. */
  fields: Record<string, string>;
}
