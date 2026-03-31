



export const CATEGORY_OPTIONS = [
  "Shoes",
  "T-Shirts",
  "Hoodies",
  "Pants",
  "Accessories",
  "Room Decor",
  "Other",
];

export function normalizeCategory(category) {
  return CATEGORY_OPTIONS.includes(category) ? category : "Other";
}
