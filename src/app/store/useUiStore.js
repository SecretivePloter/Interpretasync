// Store UI ringan untuk state antarmuka non-domain.
// - mobileNavOpen: status drawer navigasi mobile
// - collapsedGroups: state collapse/expand tiap grup sidebar (persist localStorage)
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useUiStore = create(
  persist(
    (set) => ({
      // Drawer sidebar di layar kecil.
      mobileNavOpen: false,
      openMobileNav: () => set({ mobileNavOpen: true }),
      closeMobileNav: () => set({ mobileNavOpen: false }),
      toggleMobileNav: () => set((s) => ({ mobileNavOpen: !s.mobileNavOpen })),

      // Collapse state tiap grup sidebar. Key = label grup, value = true bila collapsed.
      collapsedGroups: {},
      toggleGroup: (label) =>
        set((s) => ({
          collapsedGroups: {
            ...s.collapsedGroups,
            [label]: !s.collapsedGroups[label],
          },
        })),
    }),
    {
      name: 'ichikara-ui',
      // Hanya persist collapsedGroups; mobileNavOpen selalu reset saat reload.
      partialize: (s) => ({ collapsedGroups: s.collapsedGroups }),
    },
  ),
)
