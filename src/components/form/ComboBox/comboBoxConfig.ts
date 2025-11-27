/**
 * Centralized configuration for ComboBox and MultipleComboBox sizing
 * This provides consistent height calculations and can be easily tested
 */

export const COMBOBOX_CONFIG = {
  // Base heights
  ITEM_HEIGHT: 56,
  GROUP_HEADER_HEIGHT: 44,

  // Max visible items before scrolling
  MAX_VISIBLE_ITEMS: 5,

  // Margins and spacing (from ComboboxListItem)
  // 8px spacing above and below items (my-2 = 8px top + 8px bottom = 16px total)
  ITEM_MARGIN_TOP: 8,
  ITEM_MARGIN_BOTTOM: 8,
  LIST_PADDING: 4,

  /**
   * Calculate the max height for the listbox
   * Uses MUI's slotProps.listbox maxHeight
   */
  getListboxMaxHeight(): number {
    return (
      this.MAX_VISIBLE_ITEMS * (this.ITEM_HEIGHT + this.ITEM_MARGIN_TOP + this.ITEM_MARGIN_BOTTOM) +
      this.LIST_PADDING
    )
  },
} as const
