// Heat assignment logic based on position and total number of drivers
//
// Assignment follows rules:
// - Heat A maximum grid 30 drivers. 
// - Heat B-D maximum grid 25 drivers, with B being the fastest and D the slowest.
// - Top 3 drivers in each heat are promoted to the next heat.
// - There should be as little heats as possible.
// - Grid sizes in heats B-D should be as equal as possible, with faster being larger if they can't be equal.
export function getHeat(position: number, driverCount: number): string {
  if (position > driverCount) throw new Error("Position cannot be greater than driver count");

  if (driverCount <= 30) return "A";
  if (position <= 27) return "A";

  const R = driverCount - 27;
  const p = position - 27; // 1-indexed within drivers after group A

  if (R <= 25) {
    // 2 heats
    return "B";
  } else if (R <= 47) {
    // 3 heats, balance B and C as much as possible, with B larger if they can't be equal
    const qB = Math.ceil((R - 3) / 2);
    return p <= qB ? "B" : "C";
  } else {
    // 4 heats
    // Only up to 69 drivers fit in B-D (22+22+25)
    if (p > 69) return "Ei erää";
    // Balance B-D as much as possible, with faster heats larger if they can't be equal
    const q = Math.ceil((R - 3) / 3);
    if (p <= q) return "B";
    if (p <= 2 * q) return "C";
    return "D";
  }
}
