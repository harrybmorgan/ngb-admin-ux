/** Shared delivery method options and helpers for Add Communication + Add Automation. */

export const DEFAULT_DELIVERY_PREFERENCE = 'Default Delivery Preference' as const
export const DELIVERY_METHOD_EMAIL = 'Email' as const
export const DELIVERY_METHOD_SMS = 'SMS' as const
export const DELIVERY_METHOD_DASHBOARD = 'Dashboard Notification' as const
export const DELIVERY_METHOD_LETTER = 'Letter' as const

export const DELIVERY_METHOD_OPTIONS = [
  DEFAULT_DELIVERY_PREFERENCE,
  DELIVERY_METHOD_EMAIL,
  DELIVERY_METHOD_SMS,
  DELIVERY_METHOD_DASHBOARD,
  DELIVERY_METHOD_LETTER,
] as const

export type DeliveryMethodOption = (typeof DELIVERY_METHOD_OPTIONS)[number]

export type ChannelTabId = 'email' | 'sms' | 'dashboard' | 'letter'

/**
 * "Default Delivery Preference" is exclusive: selecting it clears other channels.
 * Other options clear Default. At least one option always remains (falls back to Default).
 */
export function toggleDeliveryMethodSelection(
  current: string[],
  option: string,
): string[] {
  if (option === DEFAULT_DELIVERY_PREFERENCE) {
    return [DEFAULT_DELIVERY_PREFERENCE]
  }
  const withoutDefault = current.filter((x) => x !== DEFAULT_DELIVERY_PREFERENCE)
  if (withoutDefault.includes(option)) {
    const next = withoutDefault.filter((x) => x !== option)
    return next.length === 0 ? [DEFAULT_DELIVERY_PREFERENCE] : next
  }
  return [...withoutDefault, option]
}

/**
 * Resolves which channel tabs to show. Default-only selection keeps the original
 * Email + SMS (Text) Message pair.
 */
export function getVisibleChannelTabs(selected: string[]): ChannelTabId[] {
  if (selected.length === 1 && selected[0] === DEFAULT_DELIVERY_PREFERENCE) {
    return ['email', 'sms']
  }
  const order: ChannelTabId[] = []
  if (selected.includes(DELIVERY_METHOD_EMAIL)) order.push('email')
  if (selected.includes(DELIVERY_METHOD_SMS)) order.push('sms')
  if (selected.includes(DELIVERY_METHOD_DASHBOARD)) order.push('dashboard')
  if (selected.includes(DELIVERY_METHOD_LETTER)) order.push('letter')
  return order
}

export function isDefaultPreferenceOnly(selected: string[]): boolean {
  return selected.length === 1 && selected[0] === DEFAULT_DELIVERY_PREFERENCE
}

export function isOnlyChannel(selected: string[], option: string): boolean {
  return selected.length === 1 && selected[0] === option
}

export function formatDeliveryMethodSummary(selected: string[]): string {
  if (selected.length === 0) return 'Select…'
  return selected.join(', ')
}

export function getChannelTabLabel(tab: ChannelTabId): string {
  switch (tab) {
    case 'email':
      return 'Email'
    case 'sms':
      return 'SMS (Text) Message'
    case 'dashboard':
      return 'Dashboard Notification'
    case 'letter':
      return 'Letter'
    default:
      return 'Email'
  }
}

export function getNextChannelTab(visible: ChannelTabId[], current: ChannelTabId): ChannelTabId | null {
  const i = visible.indexOf(current)
  if (i < 0 || i >= visible.length - 1) return null
  return visible[i + 1] ?? null
}

export function getContinueToNextLabel(nextTab: ChannelTabId): string {
  return `Continue to ${getChannelTabLabel(nextTab)}`
}

/** Whether the primary Schedule action should be a single button (not the split). */
export function shouldUseSingleScheduleButton(
  selected: string[],
  messageChannelTab: ChannelTabId,
  visible: ChannelTabId[],
): boolean {
  const idx = visible.indexOf(messageChannelTab)
  const onLast = visible.length === 0 || idx === visible.length - 1
  if (!onLast) return false
  if (isDefaultPreferenceOnly(selected) && messageChannelTab === 'sms') return true
  if (isOnlyChannel(selected, DELIVERY_METHOD_EMAIL) && messageChannelTab === 'email') return true
  if (isOnlyChannel(selected, DELIVERY_METHOD_SMS) && messageChannelTab === 'sms') return true
  if (isOnlyChannel(selected, DELIVERY_METHOD_DASHBOARD) && messageChannelTab === 'dashboard') {
    return true
  }
  if (isOnlyChannel(selected, DELIVERY_METHOD_LETTER) && messageChannelTab === 'letter') return true
  return false
}
