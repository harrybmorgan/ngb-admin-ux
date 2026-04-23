/** Shared delivery method options and helpers for Add Communication + Add Automation. */
export const DELIVERY_METHOD_OPTIONS = [
  'Default Delivery Preference',
  'Email only',
  'SMS',
  'Dashboard',
] as const

export type DeliveryMethodOption = (typeof DELIVERY_METHOD_OPTIONS)[number]

export const DEFAULT_DELIVERY_PREFERENCE: DeliveryMethodOption = 'Default Delivery Preference'

export function isEmailChannelTabDisabled(deliveryMethod: string): boolean {
  return deliveryMethod === 'SMS' || deliveryMethod === 'Dashboard'
}

export function isSecondaryChannelTabDisabled(deliveryMethod: string): boolean {
  return deliveryMethod === 'Email only'
}

export function getSecondaryChannelTabLabel(deliveryMethod: string): string {
  return deliveryMethod === 'Dashboard' ? 'Dashboard' : 'SMS (Text) Message'
}

export function isDashboardDelivery(deliveryMethod: string): boolean {
  return deliveryMethod === 'Dashboard'
}

/** Footer CTA from email tab to the other channel. */
export function getContinueToSecondaryCta(deliveryMethod: string): string {
  return deliveryMethod === 'Dashboard' ? 'Continue to Dashboard' : 'Continue to SMS'
}
